const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || "./data/blog.sqlite"),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "local-dev-access-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "2h",
  defaultAdminUsername: process.env.ADMIN_DEFAULT_USERNAME || "admin",
  defaultAdminPassword: process.env.ADMIN_DEFAULT_PASSWORD || "admin123456",
  defaultAdminNickname: process.env.ADMIN_DEFAULT_NICKNAME || "Administrator",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, ""),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"),
  uploadMaxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10)
};

module.exports = env;
