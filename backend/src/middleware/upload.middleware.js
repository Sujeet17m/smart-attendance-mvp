const multer = require('multer');
const config = require('../config');
const { errorResponse } = require('../utils/response.util');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = config.upload.allowedTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize // 50MB
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File too large. Maximum size is 50MB', 413);
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }
  
  if (err) {
    return errorResponse(res, err.message, 400);
  }
  
  next();
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;