const express = require("express");
const { all, get, run } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { requireAdminAuth } = require("../../middleware/auth");
const { now } = require("../../utils/datetime");

const router = express.Router();

router.use(requireAdminAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);
    const status = req.query.status;
    const articleId = req.query.articleId;
    const where = ["c.deleted_at IS NULL"];
    const params = [];

    if (status) {
      where.push("c.status = ?");
      params.push(status);
    }

    if (articleId) {
      where.push("c.article_id = ?");
      params.push(articleId);
    }

    const whereSql = where.join(" AND ");
    const offset = (page - 1) * pageSize;
    const totalRow = await get(`SELECT COUNT(*) AS total FROM comment c WHERE ${whereSql}`, params);
    const rows = await all(
      `
        SELECT
          c.*,
          a.title AS article_title
        FROM comment c
        INNER JOIN article a ON a.id = c.article_id
        WHERE ${whereSql}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({
      items: rows.map(mapComment),
      pagination: {
        page,
        pageSize,
        total: totalRow.total
      }
    });
  })
);

router.put(
  "/:id/audit",
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "spam"].includes(status)) {
      throw new HttpError(400, "status must be pending, approved, rejected or spam");
    }

    const comment = await get("SELECT * FROM comment WHERE id = ? AND deleted_at IS NULL", [req.params.id]);

    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    await run("UPDATE comment SET status = ?, updated_at = ? WHERE id = ?", [status, now(), req.params.id]);
    await syncCommentCount(comment.article_id, comment.status, status);

    const updated = await get(
      `
        SELECT
          c.*,
          a.title AS article_title
        FROM comment c
        INNER JOIN article a ON a.id = c.article_id
        WHERE c.id = ?
      `,
      [req.params.id]
    );
    res.json(mapComment(updated));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const comment = await get("SELECT * FROM comment WHERE id = ? AND deleted_at IS NULL", [req.params.id]);

    if (!comment) {
      throw new HttpError(404, "Comment not found");
    }

    const timestamp = now();
    await run("UPDATE comment SET deleted_at = ?, updated_at = ? WHERE id = ?", [timestamp, timestamp, req.params.id]);
    await syncCommentCount(comment.article_id, comment.status, "deleted");

    res.json({ message: "Comment deleted" });
  })
);

async function syncCommentCount(articleId, previousStatus, nextStatus) {
  const wasApproved = previousStatus === "approved";
  const isApproved = nextStatus === "approved";

  if (wasApproved === isApproved) {
    return;
  }

  const delta = isApproved ? 1 : -1;
  await run(
    `
      UPDATE article
      SET comment_count = CASE
        WHEN comment_count + ? < 0 THEN 0
        ELSE comment_count + ?
      END,
      updated_at = ?
      WHERE id = ?
    `,
    [delta, delta, now(), articleId]
  );
}

function mapComment(row) {
  return {
    id: row.id,
    articleId: row.article_id,
    articleTitle: row.article_title,
    parentId: row.parent_id,
    replyToCommentId: row.reply_to_comment_id,
    userId: row.user_id,
    nickname: row.nickname,
    email: row.email,
    website: row.website,
    content: row.content,
    status: row.status,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

module.exports = router;
