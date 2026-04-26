const express = require("express");
const { all, get, run } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { now } = require("../../utils/datetime");

const router = express.Router();

router.get(
  "/articles/:id/comments",
  asyncHandler(async (req, res) => {
    const article = await get(
      "SELECT id FROM article WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
      [req.params.id]
    );

    if (!article) {
      throw new HttpError(404, "Article not found");
    }

    const rows = await all(
      `
        SELECT *
        FROM comment
        WHERE article_id = ?
          AND status = 'approved'
          AND deleted_at IS NULL
        ORDER BY created_at ASC
      `,
      [req.params.id]
    );

    res.json({
      items: buildCommentTree(rows)
    });
  })
);

router.post(
  "/articles/:id/comments",
  asyncHandler(async (req, res) => {
    const article = await get(
      `
        SELECT id, allow_comment
        FROM article
        WHERE id = ? AND status = 'published' AND deleted_at IS NULL
      `,
      [req.params.id]
    );

    if (!article) {
      throw new HttpError(404, "Article not found");
    }

    if (article.allow_comment !== 1) {
      throw new HttpError(403, "Comments are disabled for this article");
    }

    const { parentId, replyToCommentId, nickname, email, website, content } = req.body;

    if (!nickname || !content) {
      throw new HttpError(400, "nickname and content are required");
    }

    if (parentId) {
      const parent = await get(
        "SELECT id FROM comment WHERE id = ? AND article_id = ? AND deleted_at IS NULL",
        [parentId, req.params.id]
      );

      if (!parent) {
        throw new HttpError(400, "parent comment not found");
      }
    }

    if (replyToCommentId) {
      const replyTo = await get(
        "SELECT id FROM comment WHERE id = ? AND article_id = ? AND deleted_at IS NULL",
        [replyToCommentId, req.params.id]
      );

      if (!replyTo) {
        throw new HttpError(400, "replyTo comment not found");
      }
    }

    const timestamp = now();
    const result = await run(
      `
        INSERT INTO comment (
          article_id,
          parent_id,
          reply_to_comment_id,
          nickname,
          email,
          website,
          content,
          status,
          ip,
          user_agent,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `,
      [
        req.params.id,
        parentId || null,
        replyToCommentId || null,
        nickname.trim(),
        email || null,
        website || null,
        content.trim(),
        req.ip,
        req.headers["user-agent"] || null,
        timestamp,
        timestamp
      ]
    );

    const row = await get("SELECT * FROM comment WHERE id = ?", [result.lastID]);

    res.status(201).json({
      message: "Comment submitted and waiting for moderation",
      item: mapComment(row)
    });
  })
);

function buildCommentTree(rows) {
  const map = new Map();
  const roots = [];

  for (const row of rows) {
    map.set(row.id, {
      ...mapComment(row),
      replies: []
    });
  }

  for (const row of rows) {
    const item = map.get(row.id);

    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id).replies.push(item);
      continue;
    }

    roots.push(item);
  }

  return roots;
}

function mapComment(row) {
  return {
    id: row.id,
    articleId: row.article_id,
    parentId: row.parent_id,
    replyToCommentId: row.reply_to_comment_id,
    nickname: row.nickname,
    email: row.email,
    website: row.website,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = router;
