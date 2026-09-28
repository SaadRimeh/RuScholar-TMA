import mongoose from 'mongoose';
import { config } from './env';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(config.mongoUri, {
      autoIndex: config.nodeEnv !== 'production', // Build indexes in dev, rely on migrations/pre-indexing in prod
    });

    console.log(`[Database] MongoDB successfully connected to: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection lost. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB runtime error:', err);
});

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection gracefully closed.');
  } catch (error) {
    console.error('[Database] Error while closing MongoDB connection:', error);
  }
};
