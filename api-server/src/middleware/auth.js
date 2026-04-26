const { get } = require("../db/connection");
const HttpError = require("../utils/http-error");
const { verifyAccessToken } = require("../services/token-service");

async function requireAdminAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing access token");
    }

    const token = authorization.slice(7);
    const payload = verifyAccessToken(token);

    const admin = await get(
      `
        SELECT id, username, nickname, email, avatar_url, status
        FROM admin_user
        WHERE id = ? AND deleted_at IS NULL
      `,
      [payload.sub]
    );

    if (!admin || admin.status !== 1) {
      throw new HttpError(401, "Admin account is unavailable");
    }

    req.admin = {
      ...admin,
      sessionId: payload.sessionId
    };

    next();
  } catch (error) {
    next(error.status ? error : new HttpError(401, "Invalid or expired access token"));
  }
}

module.exports = {
  requireAdminAuth
};
