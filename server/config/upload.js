const multer = require('multer');
const path = require('path');

// Configure multer for storing uploaded photos
const storage = multer.memoryStorage(); // Store files in memory for direct upload to CV engine

// Configure file filter
const fileFilter = (req, file, cb) => {
  // Allow images and zip files
  const isImage = file.mimetype.startsWith('image/');
  const isZip = file.mimetype === 'application/zip' || 
                file.mimetype === 'application/x-zip-compressed' || 
                file.originalname.endsWith('.zip');
                
  if (isImage || isZip) {
    cb(null, true);
  } else {
    cb(new Error('Only image and ZIP files are allowed!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for batch zip uploads
  }
});

module.exports = upload;