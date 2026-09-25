import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    logger.info('MongoDB connection already established.');
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      autoIndex: env.isDevelopment
    });

    isConnected = true;
    logger.success(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected. Retrying...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime error:', err.message);
    });

  } catch (error) {
    logger.warn(`MongoDB Connection Warning: ${error.message}`);
    logger.info('Server continuing in detached database mode for API routes...');
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly.');
  }
}

export function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}
