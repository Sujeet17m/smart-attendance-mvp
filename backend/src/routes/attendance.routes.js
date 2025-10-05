const express = require('express');
const router = express.Router();
const { 
  markAttendance,
  getAttendanceByDate,
  getAttendanceByUser
} = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/mark', authenticate, markAttendance);
router.get('/by-date/:date', authenticate, getAttendanceByDate);
router.get('/by-user/:userId', authenticate, getAttendanceByUser);

module.exports = router;
