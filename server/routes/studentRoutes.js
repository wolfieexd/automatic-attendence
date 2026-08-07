const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const upload = require('../config/upload');

router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

// Face recognition endpoints
router.post('/enroll', upload.single('photo'), studentController.enrollStudent);
router.post('/batch-enroll', upload.single('file'), studentController.batchEnrollStudents);
router.put('/:id/photo', upload.single('photo'), studentController.updateStudentPhoto);
router.post('/verify', upload.single('photo'), studentController.verifyFace);

module.exports = router;