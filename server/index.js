require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const { connectDB } = require('./config/db');
const { sequelize } = require('./models');

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const courseRoutes = require('./routes/courseRoutes');
const photos = require('./routes/photos');

const app = express();

// Connect to database and sync models
connectDB().then(() => {
  sequelize.sync({ alter: true }).then(() => {
    console.log('SQLite Models synced successfully.');
  });
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true,
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Static file serving
app.use('/cv-engine/uploads', express.static(path.join(__dirname, '../cv-engine/uploads')));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/photos', photos);

// Legacy routes for backward compatibility
app.use('/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3070;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});