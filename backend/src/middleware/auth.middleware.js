// const jwt = require('jsonwebtoken');
// const { User } = require('../models/user.model');

// exports.authenticate = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findByPk(decoded.id);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };


const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorizedResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * JWT Authentication Middleware
 */
module.exports = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return unauthorizedResponse(res, 'No token provided');
    }

    // Check if Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Invalid token format');
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return unauthorizedResponse(res, 'No token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user to request
    req.user = decoded;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid token');
    }

    logger.error('Auth middleware error:', error);
    return unauthorizedResponse(res, 'Authentication failed');
  }
};