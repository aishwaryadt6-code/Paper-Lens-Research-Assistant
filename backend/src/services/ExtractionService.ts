import { Types } from 'mongoose';
import pdfParse from 'pdf-parse';
import { parseAcademicPaper } from '../utils/pdfParser';
import { paperRepository } from '../repositories/PaperRepository';
import { getGridFSBucket } from '../config/gridfs';
import { notificationRepository } from '../repositories/NotificationRepository';
import { relationshipService } from '../modules/ai-knowledge-graph/relationship.service';
import { autoAIPipelineService } from './AutoAIPipelineService';


const EXTRACTION_VERSION = 2;

export class ExtractionService {
  async extractMetadata(paperId: string): Promise<void> {
    const startedAt = new Date();
    
    // 1. Update status to 'processing' and log start time
    await paperRepository.updateExtractionStarted(paperId, startedAt);

    try {
      const paper = await paperRepository.findById(paperId);
      if (!paper) {
        throw new Error('Paper not found');
      }

      // 2. Fetch the file buffer from GridFS
      const bucket = getGridFSBucket();
      const downloadStream = bucket.openDownloadStream(new Types.ObjectId(paper.fileId.toString()));
      
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', resolve);
      });
      const buffer = Buffer.concat(chunks);

      // 3. Parse PDF raw text using pdf-parse
      const pdfData = await pdfParse(buffer);
      const fullText = pdfData.text || '';
      const pageCount = pdfData.numpages || 1;

      // 4. Run isolated academic parser engine
      const { sections, diagnostics } = parseAcademicPaper(fullText, paper.title);

      const completedAt = new Date();

      // 5. Save the results to MongoDB
      await paperRepository.updateExtractedMetadata(paperId, {
        metadata: {
          fullText,
          ...sections,
        },
        diagnostics,
        pageCount,
        completedAt,
        version: EXTRACTION_VERSION,
      });

      // 6. Create completion notification
      await notificationRepository.create({
        recipient: paper.uploadedBy._id.toString(),
        type: 'upload_completed',
        title: 'Metadata Extraction Complete',
        message: `Extracted sections and bibliography successfully for "${paper.title}".`,
        metadata: { paperId: paper._id.toString(), workspaceId: paper.workspace.toString() },
      });

      // 7. Trigger the AI intelligence pipeline in the background
      autoAIPipelineService.runPipelineForPaper(paperId, paper.workspace.toString()).catch((err) => {
        console.error(`[ExtractionService] Failed to run AI pipeline:`, err);
      });


    } catch (err: any) {
      console.error(`[ExtractionService] Extraction failed for paper ${paperId}:`, err);
      const errorMsg = err.message || 'Unknown extraction error';
      await paperRepository.updateExtractionFailed(paperId, errorMsg);
    }
  }
}

export const extractionService = new ExtractionService();
