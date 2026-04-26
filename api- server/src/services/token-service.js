const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken
};
