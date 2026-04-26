const express = require("express");
const { all, get, run } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { requireAdminAuth } = require("../../middleware/auth");
const { now } = require("../../utils/datetime");
const { toSlug } = require("../../utils/slugify");

const router = express.Router();

router.use(requireAdminAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await all("SELECT * FROM tag ORDER BY created_at DESC");
    res.json({ items: rows.map(mapTag) });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, slug, color } = req.body;

    if (!name) {
      throw new HttpError(400, "name is required");
    }

    const timestamp = now();
    const result = await run(
      `
        INSERT INTO tag (name, slug, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [name.trim(), buildSlug(slug, name), color || null, timestamp, timestamp]
    );

    const row = await get("SELECT * FROM tag WHERE id = ?", [result.lastID]);
    res.status(201).json(mapTag(row));
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT * FROM tag WHERE id = ?", [req.params.id]);

    if (!existing) {
      throw new HttpError(404, "Tag not found");
    }

    const { name, slug, color } = req.body;

    await run(
      `
        UPDATE tag
        SET name = ?, slug = ?, color = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        name !== undefined ? name.trim() : existing.name,
        slug !== undefined || name !== undefined ? buildSlug(slug, name || existing.name) : existing.slug,
        color !== undefined ? color : existing.color,
        now(),
        req.params.id
      ]
    );

    const row = await get("SELECT * FROM tag WHERE id = ?", [req.params.id]);
    res.json(mapTag(row));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT id FROM tag WHERE id = ?", [req.params.id]);

    if (!existing) {
      throw new HttpError(404, "Tag not found");
    }

    await run("DELETE FROM article_tag WHERE tag_id = ?", [req.params.id]);
    await run("DELETE FROM tag WHERE id = ?", [req.params.id]);

    res.json({ message: "Tag deleted" });
  })
);

function buildSlug(slug, fallback) {
  const value = toSlug(slug || fallback);

  if (!value) {
    throw new HttpError(400, "slug is required");
  }

  return value;
}

function mapTag(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = router;
