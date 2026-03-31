// Redis Connection
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

const { host, port, password, db } = config.database.redis;

const redisUrl = password
  ? `redis://:${password}@${host}:${port}/${db}`
  : `redis://${host}:${port}/${db}`;

export const redisClient = createClient({
  url: redisUrl,
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Redis connection failed:', err);
    throw err;
  }
};

// Handle connection events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
  logger.warn('Redis client disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  logger.info('Redis client disconnected through app termination');
  process.exit(0);
});
