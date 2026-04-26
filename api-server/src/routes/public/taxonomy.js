const express = require("express");
const { all } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");

const router = express.Router();

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const rows = await all(
      `
        SELECT
          c.*,
          (
            SELECT COUNT(*)
            FROM article a
            WHERE a.category_id = c.id
              AND a.status = 'published'
              AND a.deleted_at IS NULL
          ) AS article_count
        FROM category c
        WHERE c.status = 1
        ORDER BY c.sort ASC, c.created_at DESC
      `
    );

    res.json({
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        sort: row.sort,
        status: row.status,
        articleCount: row.article_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  })
);

router.get(
  "/tags",
  asyncHandler(async (req, res) => {
    const rows = await all(
      `
        SELECT
          t.*,
          (
            SELECT COUNT(*)
            FROM article_tag at
            INNER JOIN article a ON a.id = at.article_id
            WHERE at.tag_id = t.id
              AND a.status = 'published'
              AND a.deleted_at IS NULL
          ) AS article_count
        FROM tag t
        ORDER BY t.created_at DESC
      `
    );

    res.json({
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        color: row.color,
        articleCount: row.article_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  })
);

module.exports = router;
