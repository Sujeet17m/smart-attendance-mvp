/**
 * Database Connection Manager
 */

const db = require('../config/database');
const logger = require('../utils/logger.util');

/**
 * Test database connection
 */
const testDatabaseConnection = async () => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as version');
    
    if (result.rows && result.rows.length > 0) {
      logger.info('Database connection test successful', {
        time: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0]
      });
      return true;
    }
    
    throw new Error('Invalid database response');
  } catch (error) {
    logger.error('Database connection test failed:', error.message);
    throw error;
  }
};

/**
 * Check if database tables exist
 */
const checkTablesExist = async () => {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows.map(row => row.table_name);
    
    logger.info(`Found ${tables.length} tables in database:`, tables);
    
    return tables;
  } catch (error) {
    logger.error('Error checking tables:', error.message);
    throw error;
  }
};

/**
 * Run database migrations
 */
const runMigrations = async () => {
  try {
    // Check if migrations table exists
    const migrationsTableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationsTableExists.rows[0].exists) {
      logger.info('Creating migrations table...');
      await db.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Error running migrations:', error.message);
    throw error;
  }
};

module.exports = {
  testDatabaseConnection,
  checkTablesExist,
  runMigrations
};