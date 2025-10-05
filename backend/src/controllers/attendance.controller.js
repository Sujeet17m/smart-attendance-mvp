const { Attendance } = require('../models/attendance.model');
const { User } = require('../models/user.model');
const faceService = require('../services/face.service');

exports.markAttendance = async (req, res) => {
  try {
    const { userId } = req.user;
    const { imageData } = req.body;
    
    // Verify face using face service
    const verificationResult = await faceService.verifyFace(userId, imageData);
    if (!verificationResult.isMatch) {
      return res.status(400).json({ error: 'Face verification failed' });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      userId,
      date: new Date(),
      status: 'present'
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.findAll({
      where: { date },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const attendance = await Attendance.findAll({
      where: { userId },
      order: [['date', 'DESC']]
    });
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
