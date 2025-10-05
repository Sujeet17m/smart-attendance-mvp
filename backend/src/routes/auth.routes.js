// const express = require('express');
// const router = express.Router();
// const { register, login } = require('../controllers/auth.controller');

// router.post('/register', register);
// router.post('/login', login);

// module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
