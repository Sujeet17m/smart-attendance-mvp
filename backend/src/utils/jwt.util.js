const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate access token
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Generate refresh token
 */
exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

/**
 * Verify token
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification
 */
exports.decodeToken = (token) => {
  return jwt.decode(token);
};