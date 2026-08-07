const { sequelize } = require('../config/db');
const Student = require('./Student');
const Course = require('./Course');
const Attendance = require('./Attendance');

// Define associations
Student.hasMany(Attendance, { foreignKey: 'StudentId' });
Attendance.belongsTo(Student, { foreignKey: 'StudentId' });

Course.hasMany(Attendance, { foreignKey: 'CourseId' });
Attendance.belongsTo(Course, { foreignKey: 'CourseId' });

module.exports = {
  sequelize,
  Student,
  Course,
  Attendance
};
