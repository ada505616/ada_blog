const express = require("express");
const { all, get, run } = require("../../db/connection");
const asyncHandler = require("../../utils/async-handler");
const HttpError = require("../../utils/http-error");
const { comparePassword } = require("../../utils/password");
const { addDays, now } = require("../../utils/datetime");
const {
  signAccessToken,
  generateRefreshToken
} = require("../../services/token-service");
const { requireAdminAuth } = require("../../middleware/auth");

const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new HttpError(400, "username and password are required");
    }

    const admin = await get(
      `
        SELECT *
        FROM admin_user
        WHERE username = ? AND deleted_at IS NULL
      `,
      [username]
    );

    if (!admin) {
      throw new HttpError(401, "Invalid username or password");
    }

    if (admin.status !== 1) {
      throw new HttpError(403, "Admin account is disabled");
    }

    const matched = await comparePassword(password, admin.password_hash);

    if (!matched) {
      throw new HttpError(401, "Invalid username or password");
    }

    const timestamp = now();
    const refreshToken = generateRefreshToken();
    const session = await run(
      `
        INSERT INTO admin_session (
          admin_user_id,
          refresh_token,
          expired_at,
          ip,
          user_agent,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        admin.id,
        refreshToken,
        addDays(30),
        req.ip,
        req.headers["user-agent"] || null,
        timestamp,
        timestamp
      ]
    );

    await run(
      "UPDATE admin_user SET last_login_at = ?, updated_at = ? WHERE id = ?",
      [timestamp, timestamp, admin.id]
    );

    const accessToken = signAccessToken({
      sub: admin.id,
      username: admin.username,
      sessionId: session.lastID
    });

    res.json({
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        email: admin.email,
        avatarUrl: admin.avatar_url,
        lastLoginAt: admin.last_login_at
      }
    });
  })
);

router.post(
  "/logout",
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};

    if (refreshToken) {
      await run("DELETE FROM admin_session WHERE refresh_token = ?", [refreshToken]);
    } else if (req.admin.sessionId) {
      await run("DELETE FROM admin_session WHERE id = ?", [req.admin.sessionId]);
    }

    res.json({ message: "Logged out" });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new HttpError(400, "refreshToken is required");
    }

    const session = await get(
      `
        SELECT s.*, u.username, u.nickname, u.email, u.avatar_url, u.status AS user_status
        FROM admin_session s
        INNER JOIN admin_user u ON u.id = s.admin_user_id
        WHERE s.refresh_token = ? AND u.deleted_at IS NULL
      `,
      [refreshToken]
    );

    if (!session) {
      throw new HttpError(401, "Refresh session not found");
    }

    if (session.user_status !== 1) {
      throw new HttpError(403, "Admin account is disabled");
    }

    if (new Date(session.expired_at).getTime() <= Date.now()) {
      await run("DELETE FROM admin_session WHERE id = ?", [session.id]);
      throw new HttpError(401, "Refresh token expired");
    }

    const nextRefreshToken = generateRefreshToken();
    const timestamp = now();

    await run(
      `
        UPDATE admin_session
        SET refresh_token = ?, expired_at = ?, updated_at = ?
        WHERE id = ?
      `,
      [nextRefreshToken, addDays(30), timestamp, session.id]
    );

    const accessToken = signAccessToken({
      sub: session.admin_user_id,
      username: session.username,
      sessionId: session.id
    });

    res.json({
      accessToken,
      refreshToken: nextRefreshToken,
      admin: {
        id: session.admin_user_id,
        username: session.username,
        nickname: session.nickname,
        email: session.email,
        avatarUrl: session.avatar_url
      }
    });
  })
);

router.get(
  "/me",
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const sessions = await all(
      `
        SELECT id, ip, user_agent, expired_at, created_at
        FROM admin_session
        WHERE admin_user_id = ?
        ORDER BY created_at DESC
      `,
      [req.admin.id]
    );

    res.json({
      admin: {
        id: req.admin.id,
        username: req.admin.username,
        nickname: req.admin.nickname,
        email: req.admin.email,
        avatarUrl: req.admin.avatar_url
      },
      sessions
    });
  })
);

module.exports = router;
