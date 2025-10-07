// AWS configuration is now OPTIONAL
// Only loads if credentials are provided

let s3 = null;
let AWS = null;

const isAWSConfigured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
};

if (isAWSConfigured()) {
  try {
    AWS = require('aws-sdk');
    
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    s3 = new AWS.S3();
    console.log('✅ AWS S3 configured successfully');
  } catch (error) {
    console.warn('⚠️  AWS SDK not available. Install with: npm install aws-sdk');
    console.log('ℹ️  Continuing without AWS S3 support');
  }
} else {
  console.log('ℹ️  AWS credentials not configured. Using local storage.');
}

module.exports = { 
  s3, 
  AWS, 
  isAWSConfigured: isAWSConfigured() 
};