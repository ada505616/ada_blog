const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const PLACEHOLDER_PATTERNS = [/^change-me/i, /^your-/i, /^replace-with/i];

function assertConfigured(name, value) {
  if (!value || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(`${name} must be configured with a real value`);
  }
}

const env = {
  port: Number(process.env.PORT || 3000),
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || "./data/blog.sqlite"),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "2h",
  defaultAdminUsername: process.env.ADMIN_DEFAULT_USERNAME || "",
  defaultAdminPassword: process.env.ADMIN_DEFAULT_PASSWORD || "",
  defaultAdminNickname: process.env.ADMIN_DEFAULT_NICKNAME || "Administrator",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, ""),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"),
  uploadMaxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10),
  assertConfigured
};

assertConfigured("JWT_ACCESS_SECRET", env.jwtAccessSecret);

module.exports = env;
