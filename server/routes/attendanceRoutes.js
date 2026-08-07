const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Basic attendance routes
router.get('/', attendanceController.getAttendance);
router.post('/', attendanceController.markAttendance);
router.get('/stats', attendanceController.getAttendanceStats);
router.get('/live', attendanceController.getLiveAttendance);
router.delete('/:id', attendanceController.deleteAttendance);
router.put('/:id', attendanceController.updateAttendance);

// Live attendance tracking routes
router.get('/course/:courseId', attendanceController.getByCourse);
router.get('/stream/:courseId', attendanceController.streamAttendance);
router.post('/mark/face-recognition', attendanceController.markByFaceRecognition);

module.exports = router;