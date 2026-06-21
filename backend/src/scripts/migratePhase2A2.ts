import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Paper } from '../models/Paper';
import { logger } from '../utils/logger';

async function runMigration() {
  try {
    logger.info('Starting migration for Phase 2A.2 (Dynamic Sections and Diagnostics)...');
    
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Find all papers that do not have parserDiagnostics.documentType or extractedMetadata.sections
    const papersToMigrate = await Paper.find({
      $or: [
        { 'extractedMetadata.sections': { $exists: false } },
        { 'parserDiagnostics.documentType': { $exists: false } }
      ]
    });

    logger.info(`Found ${papersToMigrate.length} papers that require migration`);

    if (papersToMigrate.length > 0) {
      let updatedCount = 0;
      for (const paper of papersToMigrate) {
        // Initialize dynamic sections if missing
        if (!paper.extractedMetadata) {
          paper.extractedMetadata = {
            fullText: '',
            title: paper.title || '',
            authors: '',
            abstract: '',
            keywords: '',
            introduction: '',
            methodology: '',
            results: '',
            conclusion: '',
            references: '',
            sections: [],
          };
        } else if (!paper.extractedMetadata.sections) {
          paper.extractedMetadata.sections = [];
        }

        // Initialize parserDiagnostics if missing
        if (!paper.parserDiagnostics) {
          paper.parserDiagnostics = {
            parserVersion: '2.2',
            documentType: 'unknown',
            detectedTitle: paper.title || '',
            detectedAuthors: '',
            detectedSections: [],
            missingSections: [],
            parserWarnings: [],
            extractionConfidence: 0,
            hasTableOfContents: false,
          };
        } else {
          if (!paper.parserDiagnostics.documentType) {
            paper.parserDiagnostics.documentType = 'unknown';
          }
          if (paper.parserDiagnostics.extractionConfidence === undefined) {
            paper.parserDiagnostics.extractionConfidence = 0;
          }
          if (paper.parserDiagnostics.hasTableOfContents === undefined) {
            paper.parserDiagnostics.hasTableOfContents = false;
          }
          if (!paper.parserDiagnostics.parserVersion) {
            paper.parserDiagnostics.parserVersion = '2.2';
          }
        }

        // Save updated paper
        await Paper.findByIdAndUpdate(paper._id, {
          $set: {
            extractedMetadata: paper.extractedMetadata,
            parserDiagnostics: paper.parserDiagnostics,
          }
        });
        updatedCount++;
      }

      logger.info(`Migration completed. Updated ${updatedCount} papers.`);
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
