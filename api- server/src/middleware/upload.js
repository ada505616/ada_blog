const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");
const HttpError = require("../utils/http-error");

fs.mkdirSync(env.uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif"
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.uploadDir);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname || "") || guessExtension(file.mimetype);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }

    cb(null, true);
  }
});

function handleSingleUpload(fieldName) {
  return function uploadMiddleware(req, res, next) {
    const middleware = upload.single(fieldName);

    middleware(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        next(new HttpError(400, `File exceeds ${env.uploadMaxFileSizeMb}MB limit`));
        return;
      }

      next(error);
    });
  };
}

function guessExtension(mimeType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif"
  };

  return map[mimeType] || "";
}

module.exports = {
  handleSingleUpload
};
