const { Student } = require('../models');
const { Op } = require('sequelize');
const cvEngineService = require('../services/cvEngineService');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { department, year, section, search } = req.query;
    let where = {};

    if (department) where.department = department;
    if (year) where.year = parseInt(year);
    if (section) where.section = section;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const students = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { studentId: req.params.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new student
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID or Email already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { studentId: req.params.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    await student.update(req.body);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { studentId: req.params.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await student.destroy();

    // Delete student from CV engine (face recognition system)
    try {
      const cvDeleteResult = await cvEngineService.deleteStudent(req.params.id);
      console.log('CV Engine delete result:', cvDeleteResult);
    } catch (cvError) {
      console.error('Error deleting student from CV engine:', cvError.message);
    }

    res.json({ 
      success: true, 
      message: 'Student deleted successfully',
      studentId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enroll student with face photo
exports.enrollStudent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    if (!req.body.studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // First check if student exists
    const student = await Student.findOne({ where: { studentId: req.body.studentId } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Process photo with CV engine
    const enrollmentResult = await cvEngineService.enrollStudent(req.file, req.body.studentId);

    if (!enrollmentResult.success) {
      return res.status(400).json({
        success: false,
        message: enrollmentResult.message
      });
    }

    // Update student record with photo status
    await student.update({ hasEnrolledFace: true });

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        student,
        enrollment: enrollmentResult
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update student's face photo
exports.updateStudentPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const student = await Student.findOne({ where: { studentId: req.params.id } });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Process new photo with CV engine
    const enrollmentResult = await cvEngineService.enrollStudent(req.file, req.params.id);

    if (!enrollmentResult.success) {
      return res.status(400).json({
        success: false,
        message: enrollmentResult.message
      });
    }

    // Update student record
    await student.update({ hasEnrolledFace: true });

    res.json({
      success: true,
      message: 'Student photo updated successfully',
      data: {
        student,
        enrollment: enrollmentResult
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Verify a face against enrolled students
exports.verifyFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const verificationResult = await cvEngineService.verifyFace(req.file);
    res.json(verificationResult);

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};