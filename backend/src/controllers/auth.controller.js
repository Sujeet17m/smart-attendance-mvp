// const { generateToken } = require('../utils/jwt.utils');
// const { hashPassword, comparePassword } = require('../utils/password.utils');
// const { User } = require('../models/user.model');

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const hashedPassword = await hashPassword(password);
//     const user = await User.create({ name, email, password: hashedPassword });
//     const token = generateToken(user);
//     res.status(201).json({ user, token });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     const isValid = await comparePassword(password, user.password);
//     if (!isValid) {
//       return res.status(401).json({ error: 'Invalid password' });
//     }
//     const token = generateToken(user);
//     res.json({ user, token });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken, generateRefreshToken } = require('../utils/jwt.util');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response.util');
const logger = require('../utils/logger.util');

/**
 * Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Find teacher
    const result = await db.query(
      'SELECT * FROM teachers WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    const teacher = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, teacher.password_hash);

    if (!isValidPassword) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Update last login
    await db.query(
      'UPDATE teachers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [teacher.id]
    );

    // Generate tokens
    const accessToken = generateToken({ id: teacher.id, email: teacher.email });
    const refreshToken = generateRefreshToken({ id: teacher.id });

    // Log successful login
    logger.info('Teacher logged in', { teacherId: teacher.id, email: teacher.email });

    // Remove sensitive data
    delete teacher.password_hash;

    return successResponse(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: teacher
    }, 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * Get current user profile
 */
exports.me = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, email, name, phone, created_at, last_login FROM teachers WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return notFoundResponse(res, 'User not found');
    }

    return successResponse(res, result.rows[0]);

  } catch (error) {
    logger.error('Get profile error:', error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Logout (client-side token invalidation)
 */
exports.logout = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success
    logger.info('Teacher logged out', { teacherId: req.user.id });

    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    
    const decoded = jwt.verify(refresh_token, config.jwt.refreshSecret);

    // Generate new access token
    const accessToken = generateToken({ id: decoded.id });

    return successResponse(res, {
      access_token: accessToken,
      expires_in: 3600
    }, 'Token refreshed');

  } catch (error) {
    logger.error('Refresh token error:', error);
    return unauthorizedResponse(res, 'Invalid refresh token');
  }
};
