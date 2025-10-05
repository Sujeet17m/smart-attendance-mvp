/**
 * Central Configuration Manager
 */

require('dotenv').config();

const config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'Smart Attendance System',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    apiVersion: process.env.API_VERSION || 'v1'
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    }
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 3600,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 604800
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.S3_BUCKET,
      urlExpiry: parseInt(process.env.S3_URL_EXPIRY) || 3600
    }
  },

  // Face Recognition Service
  faceService: {
    url: process.env.FACE_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.FACE_SERVICE_API_KEY,
    timeout: parseInt(process.env.FACE_SERVICE_TIMEOUT) || 30000
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // n8n
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileError: process.env.LOG_FILE_ERROR || 'logs/error.log',
    fileCombined: process.env.LOG_FILE_COMBINED || 'logs/combined.log'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'video/webm,video/mp4').split(',')
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'database.url',
    'jwt.secret',
    'aws.accessKeyId',
    'aws.secretAccessKey'
  ];

  const missing = [];

  required.forEach(key => {
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value[k];
      if (!value) {
        missing.push(key);
        break;
      }
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Validate on import
if (process.env.NODE_ENV !== 'test') {
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration Error:', error.message);
    process.exit(1);
  }
}

module.exports = config;