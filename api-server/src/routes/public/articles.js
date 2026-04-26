const express = require("express");
const { all, get, run } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { mapArticleDetail, mapArticleListItem } = require("../../services/article-service");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);
    const categorySlug = req.query.category;
    const tagSlug = req.query.tag;
    const keyword = (req.query.keyword || "").trim();
    const where = ["a.deleted_at IS NULL", "a.status = 'published'"];
    const params = [];

    if (categorySlug) {
      where.push("c.slug = ?");
      params.push(categorySlug);
    }

    if (tagSlug) {
      where.push("EXISTS (SELECT 1 FROM article_tag at INNER JOIN tag t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.slug = ?)");
      params.push(tagSlug);
    }

    if (keyword) {
      where.push("(a.title LIKE ? OR a.summary LIKE ? OR a.content_text LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = where.join(" AND ");
    const offset = (page - 1) * pageSize;
    const totalRow = await get(
      `
        SELECT COUNT(*) AS total
        FROM article a
        LEFT JOIN category c ON c.id = a.category_id
        WHERE ${whereSql}
      `,
      params
    );

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
        ORDER BY a.is_top DESC, a.published_at DESC, a.created_at DESC
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

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
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
        WHERE a.slug = ? AND a.status = 'published' AND a.deleted_at IS NULL
      `,
      [req.params.slug]
    );

    if (!article) {
      throw new HttpError(404, "Article not found");
    }

    const tags = await all(
      `
        SELECT t.id, t.name, t.slug, t.color
        FROM article_tag at
        INNER JOIN tag t ON t.id = at.tag_id
        WHERE at.article_id = ?
        ORDER BY t.name ASC
      `,
      [article.id]
    );

    await run("UPDATE article SET view_count = view_count + 1 WHERE id = ?", [article.id]);
    article.view_count += 1;

    res.json(mapArticleDetail(article, tags));
  })
);

module.exports = router;
