// /**
//  * Express Application Configuration
//  */

// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const rateLimit = require('express-rate-limit');

// const routes = require('./routes');
// const errorMiddleware = require('./middleware/error.middleware');
// const loggerMiddleware = require('./middleware/logger.middleware');
// const logger = require('./utils/logger.util');

// const express = require('express');
// const path = require('path');
// const app = express();

// const express = require('express');
// const path = require('path');
// const cors = require('cors');


// // ... your existing middleware ...
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ... your existing code ...

// // Serve face images from local storage
// app.use('/storage', express.static(
//   path.join(__dirname, '../../face-service/storage')
// ));

// // ... rest of your code ...

// // ============================================================================
// // SECURITY MIDDLEWARE
// // ============================================================================

// // Helmet - Security headers
// app.use(helmet({
//   contentSecurityPolicy: false, // Disable for development
//   crossOriginEmbedderPolicy: false
// }));

// // CORS Configuration
// const corsOptions = {
//   origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
//   credentials: true,
//   optionsSuccessStatus: 200,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// };
// app.use(cors(corsOptions));

// // Rate Limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use('/api/', limiter);

// // ============================================================================
// // BODY PARSING MIDDLEWARE
// // ============================================================================

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // ============================================================================
// // COMPRESSION
// // ============================================================================

// app.use(compression());

// // ============================================================================
// // REQUEST LOGGING
// // ============================================================================

// if (process.env.NODE_ENV === 'development') {
//   app.use(loggerMiddleware);
// }

// // ============================================================================
// // HEALTH CHECK ENDPOINT
// // ============================================================================

// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'ok',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV,
//     version: process.env.npm_package_version || '1.0.0'
//   });
// });

// // API Routes
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Smart Attendance System API',
//     version: '1.0.0',
//     endpoints: {
//       health: '/health',
//       api: '/api',
//       docs: '/api/docs'
//     }
//   });
// });

// // ============================================================================
// // API ROUTES
// // ============================================================================

// app.use('/api', routes);

// // ============================================================================
// // ERROR HANDLING
// // ============================================================================

// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//     path: req.path
//   });
// });

// // Global Error Handler
// app.use(errorMiddleware);

// // ============================================================================
// // EXPORT APP
// // ============================================================================

// module.exports = app;

/**
 * Express Application Configuration
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');
const loggerMiddleware = require('./middleware/logger.middleware');

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ============================================================================
// BODY PARSING & COMPRESSION
// ============================================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// ============================================================================
// REQUEST LOGGING
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  app.use(loggerMiddleware);
}

// ============================================================================
// SERVE FACE IMAGES FROM LOCAL STORAGE
// ============================================================================

app.use('/storage', express.static(
  path.join(__dirname, '../../face-service/storage'),
  {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg') || filepath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }
));

// Optional route to check if image exists
app.get('/storage/check/:studentId/:filename', (req, res) => {
  const { studentId, filename } = req.params;
  const fs = require('fs');
  const imagePath = path.join(__dirname, '../../face-service/storage/faces', studentId, filename);

  if (fs.existsSync(imagePath)) {
    res.json({ exists: true, url: `/storage/faces/${studentId}/${filename}` });
  } else {
    res.status(404).json({ exists: false, message: 'Image not found' });
  }
});

// ============================================================================
// HEALTH CHECK & ROOT ENDPOINT
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Smart Attendance System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api', routes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use(errorMiddleware);

// ============================================================================
// EXPORT APP
// ============================================================================

module.exports = app;
