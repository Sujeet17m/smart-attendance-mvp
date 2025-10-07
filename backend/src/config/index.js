require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'smart_attendance',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    // Construct URL for libraries that need it
    url: `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'smart_attendance'}`
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || null,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || null,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || null,
    // Check if AWS is configured
    isConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  },
  
  faceService: {
    url: process.env.FACE_SERVICE_URL || 'http://localhost:8002'
  },
  
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
    path: process.env.UPLOAD_PATH || './uploads'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};