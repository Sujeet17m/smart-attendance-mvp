const express = require('express');
const router = express.Router();
const { 
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFaceImage,      // 🆕 NEW
  getStudentFaceImages      // 🆕 NEW
} = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Existing routes
router.get('/', authenticate, getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, createStudent);
router.put('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, deleteStudent);

// 🆕 NEW: Face image routes
router.get('/:id/face-image', authenticate, getStudentFaceImage);
router.get('/:id/face-images', authenticate, getStudentFaceImages);

module.exports = router;