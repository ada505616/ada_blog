const express = require("express");
const { all, get, run, transaction } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { requireAdminAuth } = require("../../middleware/auth");
const { mapArticleDetail, mapArticleListItem } = require("../../services/article-service");
const { now } = require("../../utils/datetime");
const { toSlug } = require("../../utils/slugify");

const router = express.Router();

router.use(requireAdminAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);
    const status = req.query.status;
    const keyword = (req.query.keyword || "").trim();

    const where = ["a.deleted_at IS NULL"];
    const params = [];

    if (status) {
      where.push("a.status = ?");
      params.push(status);
    }

    if (keyword) {
      where.push("(a.title LIKE ? OR a.summary LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = where.join(" AND ");
    const offset = (page - 1) * pageSize;

    const totalRow = await get(`SELECT COUNT(*) AS total FROM article a WHERE ${whereSql}`, params);
    const rows = await all(
      `
        SELECT
          a.*,
          u.username AS author_username,
          u.nickname AS author_nickname,
          c.name AS category_name,
          c.slug AS category_slug
        FROM article a
        INNER JOIN admin_user u ON u.id = a.author_id
        LEFT JOIN category c ON c.id = a.category_id
        WHERE ${whereSql}
        ORDER BY a.is_top DESC, a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({
      items: rows.map(mapArticleListItem),
      pagination: {
        page,
        pageSize,
        total: totalRow.total
      }
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const articleId = await createArticle(req.admin.id, req.body);
    const article = await loadArticleDetail(articleId);
    res.status(201).json(article);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const article = await loadArticleDetail(req.params.id);

    if (!article) {
      throw new HttpError(404, "Article not found");
    }

    res.json(article);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT id FROM article WHERE id = ? AND deleted_at IS NULL", [req.params.id]);

    if (!existing) {
      throw new HttpError(404, "Article not found");
    }

    await updateArticle(req.params.id, req.body);
    const article = await loadArticleDetail(req.params.id);
    res.json(article);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await run(
      "UPDATE article SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      [now(), now(), req.params.id]
    );

    if (!result.changes) {
      throw new HttpError(404, "Article not found");
    }

    res.json({ message: "Article deleted" });
  })
);

router.post(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const timestamp = now();
    const result = await run(
      `
        UPDATE article
        SET status = 'published',
            published_at = COALESCE(published_at, ?),
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `,
      [timestamp, timestamp, req.params.id]
    );

    if (!result.changes) {
      throw new HttpError(404, "Article not found");
    }

    const article = await loadArticleDetail(req.params.id);
    res.json(article);
  })
);

async function createArticle(authorId, payload) {
  validateArticlePayload(payload, false);

  return transaction(async (trx) => {
    const timestamp = now();
    const slug = buildArticleSlug(payload.slug, payload.title);
    const contentJson = serializeJsonField(payload.contentJson);
    const tagIds = normalizeTagIds(payload.tagIds);

    await ensureCategoryExists(payload.categoryId);
    await ensureTagsExist(tagIds);

    const insertResult = await trx.run(
      `
        INSERT INTO article (
          title,
          slug,
          summary,
          cover_image_url,
          author_id,
          category_id,
          content_type,
          content_json,
          content_html,
          content_text,
          status,
          is_top,
          allow_comment,
          published_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.title.trim(),
        slug,
        payload.summary || null,
        payload.coverImageUrl || null,
        authorId,
        payload.categoryId || null,
        payload.contentType,
        contentJson,
        payload.contentHtml || null,
        payload.contentText || null,
        payload.status,
        payload.isTop ? 1 : 0,
        payload.allowComment === false ? 0 : 1,
        payload.status === "published" ? payload.publishedAt || timestamp : null,
        timestamp,
        timestamp
      ]
    );

    for (const tagId of tagIds) {
      await trx.run(
        "INSERT INTO article_tag (article_id, tag_id, created_at) VALUES (?, ?, ?)",
        [insertResult.lastID, tagId, timestamp]
      );
    }

    return insertResult.lastID;
  });
}

async function updateArticle(articleId, payload) {
  validateArticlePayload(payload, true);

  return transaction(async (trx) => {
    const timestamp = now();
    const tagIds = normalizeTagIds(payload.tagIds);

    if (payload.categoryId !== undefined) {
      await ensureCategoryExists(payload.categoryId);
    }

    await ensureTagsExist(tagIds);

    const updates = [];
    const params = [];

    assignIfProvided(updates, params, "title = ?", payload.title ? payload.title.trim() : undefined);
    assignIfProvided(updates, params, "slug = ?", payload.slug ? buildArticleSlug(payload.slug) : undefined);
    assignIfProvided(updates, params, "summary = ?", payload.summary);
    assignIfProvided(updates, params, "cover_image_url = ?", payload.coverImageUrl);
    assignIfProvided(updates, params, "category_id = ?", payload.categoryId);
    assignIfProvided(updates, params, "content_type = ?", payload.contentType);
    assignIfProvided(updates, params, "content_json = ?", payload.contentJson !== undefined ? serializeJsonField(payload.contentJson) : undefined);
    assignIfProvided(updates, params, "content_html = ?", payload.contentHtml);
    assignIfProvided(updates, params, "content_text = ?", payload.contentText);
    assignIfProvided(updates, params, "status = ?", payload.status);

    if (payload.isTop !== undefined) {
      updates.push("is_top = ?");
      params.push(payload.isTop ? 1 : 0);
    }

    if (payload.allowComment !== undefined) {
      updates.push("allow_comment = ?");
      params.push(payload.allowComment ? 1 : 0);
    }

    if (payload.status === "published") {
      updates.push("published_at = ?");
      params.push(payload.publishedAt || timestamp);
    }

    updates.push("updated_at = ?");
    params.push(timestamp);

    await trx.run(`UPDATE article SET ${updates.join(", ")} WHERE id = ?`, [...params, articleId]);

    if (payload.tagIds !== undefined) {
      await trx.run("DELETE FROM article_tag WHERE article_id = ?", [articleId]);

      for (const tagId of tagIds) {
        await trx.run(
          "INSERT INTO article_tag (article_id, tag_id, created_at) VALUES (?, ?, ?)",
          [articleId, tagId, timestamp]
        );
      }
    }
  });
}

async function loadArticleDetail(articleId) {
  const article = await get(
    `
      SELECT
        a.*,
        u.username AS author_username,
        u.nickname AS author_nickname,
        c.name AS category_name,
        c.slug AS category_slug
      FROM article a
      INNER JOIN admin_user u ON u.id = a.author_id
      LEFT JOIN category c ON c.id = a.category_id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `,
    [articleId]
  );

  if (!article) {
    return null;
  }

  const tagRows = await all(
    `
      SELECT t.id, t.name, t.slug, t.color
      FROM article_tag at
      INNER JOIN tag t ON t.id = at.tag_id
      WHERE at.article_id = ?
      ORDER BY t.name ASC
    `,
    [articleId]
  );

  return mapArticleDetail(article, tagRows);
}

function validateArticlePayload(payload, isUpdate) {
  if (!isUpdate) {
    const requiredFields = ["title", "contentType", "status"];

    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new HttpError(400, `${field} is required`);
      }
    }
  }

  if (payload.status && !["draft", "published", "private"].includes(payload.status)) {
    throw new HttpError(400, "status must be draft, published or private");
  }

  if (payload.contentType && !["markdown", "editorjs", "tiptap"].includes(payload.contentType)) {
    throw new HttpError(400, "contentType must be markdown, editorjs or tiptap");
  }
}

function buildArticleSlug(input, fallbackTitle) {
  const slug = toSlug(input || fallbackTitle);

  if (!slug) {
    throw new HttpError(400, "slug is required");
  }

  return slug;
}

function serializeJsonField(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

function normalizeTagIds(tagIds) {
  if (tagIds === undefined || tagIds === null) {
    return [];
  }

  if (!Array.isArray(tagIds)) {
    throw new HttpError(400, "tagIds must be an array");
  }

  return [...new Set(tagIds.map((id) => Number(id)).filter(Boolean))];
}

async function ensureCategoryExists(categoryId) {
  if (categoryId === undefined || categoryId === null || categoryId === "") {
    return;
  }

  const category = await get("SELECT id FROM category WHERE id = ?", [categoryId]);

  if (!category) {
    throw new HttpError(400, "category not found");
  }
}

async function ensureTagsExist(tagIds) {
  if (!tagIds.length) {
    return;
  }

  const placeholders = tagIds.map(() => "?").join(", ");
  const rows = await all(`SELECT id FROM tag WHERE id IN (${placeholders})`, tagIds);

  if (rows.length !== tagIds.length) {
    throw new HttpError(400, "one or more tags do not exist");
  }
}

function assignIfProvided(updates, params, sql, value) {
  if (value !== undefined) {
    updates.push(sql);
    params.push(value === "" ? null : value);
  }
}

module.exports = router;
