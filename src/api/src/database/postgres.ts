// PostgreSQL Database Connection
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

const { host, port, database, user, password } = config.database.postgres;

export const pgPool = new Pool({
  host,
  port,
  database,
  user,
  password,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection from the pool
});

// Test connection
pgPool.connect()
  .then(client => {
    logger.info('PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => {
    logger.error('PostgreSQL connection failed:', err);
  });

// Handle connection errors
pgPool.on('error', (err, client) => {
  logger.error('PostgreSQL idle client error:', err);
  process.exit(-1);
});

export const pgQuery = async (text: string, params?: any[]) => {
  const start = Date.now();
  const result = await pgPool.query(text, params);
  const duration = Date.now() - start;
  logger.debug(
    {
      query: text,
      params,
      duration: `${duration}ms`,
      rowCount: result.rowCount,
    },
    'PostgreSQL query executed'
  );
  return result;
};
