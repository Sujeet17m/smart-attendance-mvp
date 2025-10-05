#!/usr/bin/env node
/**
 * Smart Attendance System - Backend Server
 * Entry point for the application
 */

require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger.util');
const { testDatabaseConnection } = require('./src/database/connection');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await testDatabaseConnection();
    logger.info('✓ Database connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('╔════════════════════════════════════════════╗');
      logger.info('║   Smart Attendance System - Backend API   ║');
      logger.info('╚════════════════════════════════════════════╝');
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${NODE_ENV}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}/api`);
      logger.info(`✓ Health Check: http://localhost:${PORT}/health`);
      logger.info('');
      logger.info('Press CTRL+C to stop the server');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('✓ HTTP server closed');
        logger.info('✓ Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();