import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Paper } from '../models/Paper';
import { logger } from '../utils/logger';

async function runMigration() {
  try {
    logger.info('Starting migration for Phase 2A (PDF Intelligence Engine)...');
    
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Find all papers that do not have extractionStatus set
    const papersToMigrate = await Paper.find({
      $or: [
        { extractionStatus: { $exists: false } },
        { extractionStatus: null }
      ]
    });

    logger.info(`Found ${papersToMigrate.length} papers that require migration`);

    if (papersToMigrate.length > 0) {
      const result = await Paper.updateMany(
        {
          $or: [
            { extractionStatus: { $exists: false } },
            { extractionStatus: null }
          ]
        },
        {
          $set: {
            extractionStatus: 'pending',
            extractionError: null,
            extractionStartedAt: null,
            extractionCompletedAt: null,
            extractionVersion: 0,
            extractedMetadata: {
              fullText: '',
              title: '',
              authors: '',
              abstract: '',
              keywords: '',
              introduction: '',
              methodology: '',
              results: '',
              conclusion: '',
              references: ''
            }
          }
        }
      );

      logger.info(`Migration completed. Updated ${result.modifiedCount} papers.`);
    } else {
      logger.info('No papers needed migration.');
    }

    await mongoose.connection.close();
    logger.info('Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
}

runMigration();
