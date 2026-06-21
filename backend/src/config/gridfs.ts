import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { config } from './env';
import { logger } from '../utils/logger';

let bucket: GridFSBucket | null = null;

export function initGridFS(): void {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected. Cannot initialize GridFS.');
  }
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: config.upload.bucketName,
    chunkSizeBytes: 255 * 1024,
  });
  logger.info('GridFS initialized', { bucket: config.upload.bucketName });
}

export function getGridFSBucket(): GridFSBucket {
  if (!bucket) {
    throw new Error('GridFS not initialized. Call initGridFS() after DB connection.');
  }
  return bucket;
}
