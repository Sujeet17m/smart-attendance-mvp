/**
 * API Routes Aggregator
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const attendanceRoutes = require('./attendance.routes');
const classRoutes = require('./class.routes');
const studentRoutes = require('./student.routes');
const faceRoutes = require('./face.routes');

// API Information
router.get('/', (req, res) => {
  res.json({
    message: 'Smart Attendance API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      attendance: '/api/attendance',
      classes: '/api/classes',
      students: '/api/students',
      face: '/api/face'
    },
    documentation: '/api/docs'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/face', faceRoutes);

module.exports = router;