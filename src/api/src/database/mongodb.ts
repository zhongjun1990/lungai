// MongoDB Database Connection
import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

const { uri } = config.database.mongodb;

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection failed:', err);
    throw err;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection open');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose connection disconnected through app termination');
  process.exit(0);
});
