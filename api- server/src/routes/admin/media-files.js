const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { all, get, run } = require("../../db/connection");
const { requireAdminAuth } = require("../../middleware/auth");
const { handleSingleUpload } = require("../../middleware/upload");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { now } = require("../../utils/datetime");
const { getImageMetadata } = require("../../utils/image-meta");
const env = require("../../config/env");

const router = express.Router();

router.use(requireAdminAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
    const keyword = String(req.query.keyword || "").trim();
    const where = [];
    const params = [];

    if (keyword) {
      where.push("(original_name LIKE ? OR file_name LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;
    const totalRow = await get(`SELECT COUNT(*) AS total FROM media_file ${whereSql}`, params);
    const rows = await all(
      `
        SELECT *
        FROM media_file
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({
      items: rows.map(mapMediaFile),
      pagination: {
        page,
        pageSize,
        total: totalRow.total
      }
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await get("SELECT * FROM media_file WHERE id = ?", [req.params.id]);

    if (!row) {
      throw new HttpError(404, "Media file not found");
    }

    res.json(mapMediaFile(row));
  })
);

router.post(
  "/upload",
  handleSingleUpload("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "file is required");
    }

    const mediaFile = await persistUploadedFile(req, req.file, req.admin.id);

    res.status(201).json({
      item: mediaFile
    });
  })
);

router.post(
  "/editorjs",
  handleSingleUpload("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "file is required");
    }

    const mediaFile = await persistUploadedFile(req, req.file, req.admin.id);

    res.status(201).json({
      success: 1,
      file: {
        url: mediaFile.fileUrl,
        name: mediaFile.originalName || mediaFile.fileName,
        size: mediaFile.fileSize,
        mimeType: mediaFile.mimeType,
        width: mediaFile.width,
        height: mediaFile.height
      },
      mediaFile
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await get("SELECT * FROM media_file WHERE id = ?", [req.params.id]);

    if (!row) {
      throw new HttpError(404, "Media file not found");
    }

    await run("DELETE FROM media_file WHERE id = ?", [req.params.id]);

    if (row.file_path) {
      try {
        await fs.unlink(row.file_path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    res.json({ message: "Media file deleted" });
  })
);

async function persistUploadedFile(req, file, uploaderId) {
  const fileBuffer = await fs.readFile(file.path);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const duplicate = await get(
    "SELECT * FROM media_file WHERE hash = ? AND file_size = ? LIMIT 1",
    [hash, file.size]
  );

  if (duplicate) {
    await fs.unlink(file.path).catch(() => {});
    return {
      ...mapMediaFile(duplicate),
      duplicated: true
    };
  }

  const imageMeta = getImageMetadata(fileBuffer, file.mimetype);
  const timestamp = now();
  const relativePath = path.relative(env.uploadDir, file.path).replace(/\\/g, "/");
  const result = await run(
    `
      INSERT INTO media_file (
        file_name,
        original_name,
        file_ext,
        mime_type,
        file_size,
        storage_type,
        file_url,
        file_path,
        width,
        height,
        hash,
        uploader_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'local', ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      file.filename,
      file.originalname || null,
      path.extname(file.filename).replace(/^\./, "") || null,
      file.mimetype || null,
      file.size,
      buildFileUrl(req, relativePath),
      file.path,
      imageMeta.width,
      imageMeta.height,
      hash,
      uploaderId,
      timestamp,
      timestamp
    ]
  );

  const row = await get("SELECT * FROM media_file WHERE id = ?", [result.lastID]);
  return mapMediaFile(row);
}

function buildFileUrl(req, relativePath) {
  const normalizedPath = relativePath.split("/").map(encodeURIComponent).join("/");
  const baseUrl = env.publicBaseUrl || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${normalizedPath}`;
}

function mapMediaFile(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    originalName: row.original_name,
    fileExt: row.file_ext,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    storageType: row.storage_type,
    fileUrl: row.file_url,
    filePath: row.file_path,
    width: row.width,
    height: row.height,
    hash: row.hash,
    uploaderId: row.uploader_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = router;
