const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    defaultValue: 'present'
  },
  timeIn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  method: {
    type: DataTypes.ENUM('face_recognition', 'manual'),
    defaultValue: 'face_recognition'
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
  // Foreign keys StudentId and CourseId will be added automatically by associations
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['StudentId', 'CourseId', 'date'] // Match Sequelize default foreign key casing
    }
  ]
});

module.exports = Attendance;