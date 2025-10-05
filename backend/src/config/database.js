// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize({
//   database: process.env.DB_NAME,
//   username: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   dialect: 'postgres',
//   logging: process.env.NODE_ENV === 'development' ? console.log : false
// });

// module.exports = { sequelize };


/**
 * Database Configuration
 */

const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger.util');

// Create connection pool
const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Handle pool connection
pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

/**
 * Execute query with error handling
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text,
      duration,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error', {
      text,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Set a timeout to release client
  const timeout = setTimeout(() => {
    logger.error('Client checkout timeout');
    client.release();
  }, 5000);

  // Override release to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    release();
  };

  return client;
};

/**
 * Transaction wrapper
 */
const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close all connections
 */
const close = async () => {
  await pool.end();
  logger.info('Database connection pool closed');
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  close
};