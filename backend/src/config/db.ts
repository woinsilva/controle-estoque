import mongoose from 'mongoose';
import { logger } from './logger.js';

function sanitizeMongoUri(uri: string) {
  try {
    const parsed = new URL(uri);
    const database = parsed.pathname.replace(/^\//, '') || '(default)';
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${database}`;
  } catch {
    return 'unavailable';
  }
}

export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);
  logger.info({ database: sanitizeMongoUri(uri) }, 'MongoDB connected.');
  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error.');
  });
}
