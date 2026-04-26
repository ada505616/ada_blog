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
    const rows = await all("SELECT * FROM category ORDER BY sort ASC, created_at DESC");
    res.json({ items: rows.map(mapCategory) });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, slug, description, sort, status } = req.body;

    if (!name) {
      throw new HttpError(400, "name is required");
    }

    const timestamp = now();
    const result = await run(
      `
        INSERT INTO category (name, slug, description, sort, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        buildSlug(slug, name),
        description || null,
        Number(sort || 0),
        status === 0 ? 0 : 1,
        timestamp,
        timestamp
      ]
    );

    const row = await get("SELECT * FROM category WHERE id = ?", [result.lastID]);
    res.status(201).json(mapCategory(row));
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT * FROM category WHERE id = ?", [req.params.id]);

    if (!existing) {
      throw new HttpError(404, "Category not found");
    }

    const { name, slug, description, sort, status } = req.body;

    await run(
      `
        UPDATE category
        SET name = ?, slug = ?, description = ?, sort = ?, status = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        name !== undefined ? name.trim() : existing.name,
        slug !== undefined || name !== undefined ? buildSlug(slug, name || existing.name) : existing.slug,
        description !== undefined ? description : existing.description,
        sort !== undefined ? Number(sort) : existing.sort,
        status !== undefined ? Number(status) : existing.status,
        now(),
        req.params.id
      ]
    );

    const row = await get("SELECT * FROM category WHERE id = ?", [req.params.id]);
    res.json(mapCategory(row));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const articleCount = await get("SELECT COUNT(*) AS total FROM article WHERE category_id = ? AND deleted_at IS NULL", [
      req.params.id
    ]);

    if (articleCount.total > 0) {
      throw new HttpError(409, "Category is still used by articles");
    }

    const result = await run("DELETE FROM category WHERE id = ?", [req.params.id]);

    if (!result.changes) {
      throw new HttpError(404, "Category not found");
    }

    res.json({ message: "Category deleted" });
  })
);

function buildSlug(slug, fallback) {
  const value = toSlug(slug || fallback);

  if (!value) {
    throw new HttpError(400, "slug is required");
  }

  return value;
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sort: row.sort,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = router;
