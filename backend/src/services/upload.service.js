const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { s3, isAWSConfigured } = require('../config/aws');

class UploadService {
  constructor() {
    this.storageType = isAWSConfigured ? 's3' : 'local';
    this.setupStorage();
  }

  setupStorage() {
    if (this.storageType === 'local') {
      // Create local uploads directory
      const uploadDir = path.join(__dirname, '../../uploads');
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => console.log('✅ Local uploads directory ready'))
        .catch(err => console.error('Error creating uploads directory:', err));
    }
  }

  // Configure multer for local storage
  getLocalStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }

  // Configure multer for memory storage (for S3)
  getMemoryStorage() {
    return multer.memoryStorage();
  }

  // Get appropriate multer configuration
  getUploadMiddleware(fieldName = 'video', options = {}) {
    const storage = this.storageType === 'local' 
      ? this.getLocalStorage() 
      : this.getMemoryStorage();

    return multer({
      storage,
      limits: {
        fileSize: options.maxSize || 50 * 1024 * 1024, // 50MB default
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = options.allowedTypes || ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
        }
      }
    }).single(fieldName);
  }

  // Upload file (handles both local and S3)
  async uploadFile(file, folder = 'videos') {
    try {
      if (this.storageType === 'local') {
        return this.uploadToLocal(file, folder);
      } else {
        return this.uploadToS3(file, folder);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Upload to local filesystem
  async uploadToLocal(file, folder) {
    try {
      const folderPath = path.join(__dirname, '../../uploads', folder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join(folderPath, filename);

      // If file is in memory, write it
      if (file.buffer) {
        await fs.writeFile(filepath, file.buffer);
      }
      // If file is already saved by multer, it has a path
      else if (file.path) {
        // File already saved, just return the path
        return {
          success: true,
          url: `/uploads/${folder}/${path.basename(file.path)}`,
          path: file.path,
          filename: path.basename(file.path)
        };
      }

      return {
        success: true,
        url: `/uploads/${folder}/${filename}`,
        path: filepath,
        filename
      };
    } catch (error) {
      console.error('Local upload error:', error);
      throw error;
    }
  }

  // Upload to S3 (if configured)
  async uploadToS3(file, folder) {
    if (!s3) {
      throw new Error('S3 not configured. Using local storage instead.');
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${folder}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const result = await s3.upload(params).promise();

    return {
      success: true,
      url: result.Location,
      key: result.Key
    };
  }

  // Delete file
  async deleteFile(filepath) {
    try {
      if (this.storageType === 'local') {
        await fs.unlink(filepath);
      } else if (s3) {
        const key = filepath.replace(process.env.AWS_CLOUDFRONT_URL || '', '');
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key
        }).promise();
      }
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

module.exports = new UploadService();