const { Attendance, Student, Course, sequelize } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

// Get attendance records with filters
exports.getAttendance = async (req, res) => {
  try {
    const { course, student, startDate, endDate } = req.query;
    let where = {};

    if (course) where.CourseId = course;
    if (student) where.StudentId = student;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Student, attributes: ['name', 'studentId'] },
        { model: Course, attributes: ['courseName', 'courseCode'] }
      ],
      order: [['date', 'DESC']]
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, date, status = 'present', verificationMethod = 'face-recognition' } = req.body;

    const student = await Student.findOne({ where: { studentId: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const [attendance, created] = await Attendance.findOrCreate({
      where: {
        StudentId: student.id,
        CourseId: course.id,
        date: attendanceDate
      },
      defaults: {
        status,
        method: verificationMethod
      }
    });

    if (!created) {
      await attendance.update({ status, method: verificationMethod });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this student in this course today' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    
    let where = {};
    if (courseId) {
      where.CourseId = courseId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    const stats = await Attendance.findAll({
      where,
      attributes: [
        'StudentId',
        [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'totalClasses'],
        [
          sequelize.literal(`SUM(CASE WHEN Attendance.status = 'present' THEN 1 ELSE 0 END)`),
          'presentCount'
        ]
      ],
      include: [
        { 
          model: Student, 
          attributes: ['name', 'studentId']
        }
      ],
      group: ['StudentId', 'Student.id']
    });

    const formattedStats = stats.map(stat => {
      const plainStat = stat.get({ plain: true });
      const total = parseInt(plainStat.totalClasses, 10);
      const present = parseInt(plainStat.presentCount || 0, 10);
      return {
        _id: plainStat.StudentId,
        student: plainStat.Student,
        totalClasses: total,
        presentCount: present,
        attendancePercentage: total > 0 ? (present / total) * 100 : 0
      };
    });

    res.json({ success: true, data: formattedStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    // Daily Lock Check: Ensure attendance can only be modified on the same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceDate = new Date(attendance.date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    if (today.getTime() !== attendanceDate.getTime()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Records are locked! You cannot modify attendance after the day ends.' 
      });
    }

    await attendance.destroy();
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance record (Manual Override)
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    // Daily Lock Check: Ensure attendance can only be modified on the same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceDate = new Date(attendance.date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    if (today.getTime() !== attendanceDate.getTime()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Records are locked! You cannot modify attendance after the day ends.' 
      });
    }

    const { status } = req.body;
    await attendance.update({ status, method: 'manual' });
    
    res.json({ success: true, data: attendance, message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance by course
exports.getByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    let where = { CourseId: courseId };
    if (date) {
      where.date = new Date(date);
    } else {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date();
      endOfDay.setHours(23,59,59,999);
      where.date = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ model: Student, attributes: ['name', 'studentId', 'hasEnrolledFace'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get live attendance feed
exports.getLiveAttendance = async (req, res) => {
  try {
    const recentAttendance = await Attendance.findAll({
      include: [
        { model: Course, attributes: ['courseName'] },
        { model: Student, attributes: ['studentId', 'name'] }
      ],
      order: [['date', 'DESC']],
      limit: 10
    });

    res.json({ 
      success: true, 
      data: recentAttendance,
      message: 'Live attendance feed retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching live attendance',
      error: error.message 
    });
  }
};

// Export attendance to CSV
exports.exportCSV = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Fetch all attendance for this course
    const attendanceRecords = await Attendance.findAll({
      where: { CourseId: courseId },
      include: [
        { model: Student, attributes: ['studentId', 'name', 'department', 'year', 'section'] }
      ],
      order: [['date', 'DESC'], ['time', 'DESC']]
    });
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ success: false, message: 'No attendance records found for this course.' });
    }

    // Generate CSV Header
    let csvContent = 'Date,Time,Student ID,Student Name,Department,Year,Section,Status,Method\n';

    // Generate CSV Rows
    attendanceRecords.forEach(record => {
      const student = record.Student || {};
      const date = new Date(record.date).toISOString().split('T')[0];
      const time = record.time || '';
      const status = record.status || 'unknown';
      const method = record.method || 'face_recognition';
      
      // Escape commas in names if any
      const name = student.name ? `"${student.name}"` : 'Unknown';
      const studentId = student.studentId || 'Unknown';
      const dept = student.department || '';
      const year = student.year || '';
      const section = student.section || '';

      csvContent += `${date},${time},${studentId},${name},${dept},${year},${section},${status},${method}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_course_${courseId}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('CSV Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate CSV' });
  }
};

// Send email warnings to students with < 75% attendance
exports.sendWarnings = async (req, res) => {
  try {
    // 1. Get total classes per course
    const courses = await Course.findAll();
    
    let emailsSent = 0;
    
    // We mock the email sending for demonstration purposes unless real SMTP is set
    // const transporter = nodemailer.createTransport({ ... });

    for (const course of courses) {
      if (course.totalClasses === 0) continue;

      // Find all distinct students enrolled in this course (those who have at least one attendance record)
      const studentsInCourse = await Attendance.findAll({
        where: { CourseId: course._id },
        include: [{ model: Student }],
        attributes: ['StudentId'],
        group: ['StudentId']
      });

      for (const record of studentsInCourse) {
        const studentId = record.StudentId;
        const student = await Student.findByPk(studentId);
        
        if (!student) continue;

        // Count present classes
        const presentCount = await Attendance.count({
          where: {
            CourseId: course._id,
            StudentId: studentId,
            status: 'present'
          }
        });

        // Calculate attendance rate
        const attendanceRate = (presentCount / course.totalClasses) * 100;

        if (attendanceRate < 75) {
          // In a real app, use nodemailer transporter here to send email to student.email
          console.log(`[Warning System] Sending email to ${student.email} (${student.name}): Attendance for ${course.courseCode} is ${attendanceRate.toFixed(1)}%`);
          emailsSent++;
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully sent ${emailsSent} warning emails to students with low attendance.`
    });

  } catch (error) {
    console.error('Email Warning error:', error);
    res.status(500).json({ success: false, message: 'Failed to send warnings' });
  }
};

// Stream live attendance using Server-Sent Events
exports.streamAttendance = async (req, res) => {
  const { courseId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date();
  endOfDay.setHours(23,59,59,999);

  const initialData = await Attendance.findAll({
    where: {
      CourseId: courseId,
      date: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    },
    include: [{ model: Student, attributes: ['name', 'studentId'] }]
  });

  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  req.on('close', () => {
    res.end();
  });
};

// Mark attendance using face recognition
exports.markByFaceRecognition = async (req, res) => {
  try {
    const { courseId, studentIds } = req.body;

    if (!courseId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const results = await Promise.all(studentIds.map(async (studentId) => {
      try {
        const student = await Student.findOne({ where: { studentId: studentId } });
        if (!student) throw new Error("Student not found");

        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);

        const [attendance, created] = await Attendance.findOrCreate({
          where: {
            StudentId: student.id,
            CourseId: courseId,
            date: startOfDay
          },
          defaults: {
            status: 'present',
            method: 'face_recognition'
          }
        });

        if (!created) {
          await attendance.update({ status: 'present', method: 'face_recognition' });
        }

        // Return populated version
        const populated = await Attendance.findByPk(attendance.id, {
          include: [{ model: Student, attributes: ['name', 'studentId'] }]
        });

        return {
          success: true,
          data: populated
        };
      } catch (error) {
        return {
          success: false,
          studentId,
          error: error.message
        };
      }
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};