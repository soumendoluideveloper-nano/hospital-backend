/**
 * JWT Helper
 * Wraps jsonwebtoken sign / verify with project-wide secret & expiry.
 */
const jwt = require("jsonwebtoken");

/**
 * Sign a JWT token.
 * @param {object} payload     - Data to encode (e.g. { id, role, phone })
 * @param {string} [expiresIn] - Override token lifetime (e.g. "30m", "7d")
 * @returns {string} signed JWT
 */
exports.signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d"
  });

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 */
exports.verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
