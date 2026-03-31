import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.mongodb.uri);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection failed:', err);
    throw err;
  }
};

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection open');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose connection disconnected through app termination');
  process.exit(0);
});
