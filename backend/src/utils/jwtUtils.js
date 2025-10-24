const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 */

/**
 * Generate JWT token for authentication
 * @param {Object} payload - Data to encode in token (typically user id and role)
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Verify and decode JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {String|null} Token or null if not found
 */
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken
};
