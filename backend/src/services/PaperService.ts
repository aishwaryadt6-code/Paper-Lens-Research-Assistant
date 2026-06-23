import crypto from 'crypto';
import { Readable } from 'stream';
import { Types } from 'mongoose';
import { getGridFSBucket } from '../config/gridfs';
import { paperRepository } from '../repositories/PaperRepository';
import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { AppError } from '../utils/AppError';
import { IPaper } from '../models/Paper';
import { PaginatedResult } from '../types';
import { Response } from 'express';
import { extractionService } from './ExtractionService';
import { autoAIPipelineService } from './AutoAIPipelineService';

export class PaperService {
  async getPaperById(paperId: string, userId: string): Promise<IPaper> {
    const paper = await paperRepository.findById(paperId);
    if (!paper || !paper.isActive) throw AppError.notFound('Paper not found');
    const isMember = await workspaceRepository.isMember(paper.workspace.toString(), userId);
    if (!isMember) throw AppError.forbidden('Access denied');
    return paper;
  }

  async uploadPaper(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<IPaper> {
    const isMember = await workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) throw AppError.forbidden('Access denied to this workspace');

    if (!file.buffer || file.buffer.length === 0) {
      throw AppError.badRequest('File buffer is empty', 'EMPTY_FILE');
    }

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const duplicate = await paperRepository.findByChecksum(checksum, workspaceId);
    if (duplicate) {
      throw AppError.conflict(
        'This paper has already been uploaded to this workspace',
        'DUPLICATE_PAPER'
      );
    }

    // Stream buffer into GridFS via our own Mongoose-connected bucket.
    // Returns the real ObjectId assigned by GridFS — stored in papers.files._id.
    const fileId = await this.storeInGridFS(file);

    const title = file.originalname.replace(/\.pdf$/i, '').trim() || 'Untitled Paper';

    const paper = await paperRepository.create({
      title,
      originalFileName: file.originalname,
      fileId,
      fileSize: file.size,
      mimeType: 'application/pdf',
      checksum,
      workspace: new Types.ObjectId(workspaceId),
      uploadedBy: new Types.ObjectId(userId),
      status: 'ready',
    });

    await Promise.all([
      workspaceRepository.incrementPaperCount(workspaceId, 1),
      workspaceRepository.updateStorageUsed(workspaceId, file.size),
      notificationRepository.create({
        recipient: userId,
        type: 'upload_completed',
        title: 'Upload Successful',
        message: `"${title}" has been uploaded successfully.`,
        metadata: { paperId: paper._id.toString(), workspaceId },
      }),
      autoAIPipelineService.initializeJob(paper._id.toString(), workspaceId),
    ]);

    // Trigger metadata extraction asynchronously in background
    extractionService.extractMetadata(paper._id.toString()).catch((err) => {
      console.error(`Failed to start async extraction for paper ${paper._id}:`, err);
    });

    return paper;
  }

  async getPapers(
    workspaceId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<IPaper>> {
    const isMember = await workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) throw AppError.forbidden('Access denied to this workspace');

    const { papers, total } = await paperRepository.findByWorkspace(workspaceId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items: papers,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getAllPapers(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<IPaper>> {
    const { papers, total } = await paperRepository.findByUser(userId, page, limit);
    const totalPages = Math.ceil(total / limit);
    return {
      items: papers,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async deletePaper(paperId: string, userId: string): Promise<void> {
    const paper = await paperRepository.findById(paperId);
    if (!paper || !paper.isActive) throw AppError.notFound('Paper not found');

    const isMember = await workspaceRepository.isMember(
      paper.workspace.toString(),
      userId
    );
    if (!isMember) throw AppError.forbidden('Access denied');

    // Hard-delete from GridFS — removes the document from papers.files
    // and all associated chunks from papers.chunks automatically.
    const bucket = getGridFSBucket();
    try {
      await bucket.delete(new Types.ObjectId(paper.fileId.toString()));
    } catch {
      // File already absent from GridFS — continue to remove the DB document
    }

    // Hard-delete the Paper document from MongoDB
    await paperRepository.hardDelete(paperId);

    await Promise.all([
      workspaceRepository.incrementPaperCount(paper.workspace.toString(), -1),
      workspaceRepository.updateStorageUsed(paper.workspace.toString(), -paper.fileSize),
      autoAIPipelineService.deleteJob(paperId),
    ]);
  }

  async streamPaper(paperId: string, userId: string, res: Response): Promise<void> {
    const paper = await paperRepository.findById(paperId);
    if (!paper || !paper.isActive) throw AppError.notFound('Paper not found');

    const isMember = await workspaceRepository.isMember(
      paper.workspace.toString(),
      userId
    );
    if (!isMember) throw AppError.forbidden('Access denied');

    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(
      new Types.ObjectId(paper.fileId.toString())
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(paper.originalFileName)}"`,
    });

    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).json({ success: false, message: 'File not found in storage' });
      }
    });

    downloadStream.pipe(res);
  }

  async getRecentPapers(userId: string): Promise<IPaper[]> {
    return paperRepository.getRecentByUser(userId, 5);
  }

  async retryExtraction(paperId: string, userId: string): Promise<IPaper> {
    const paper = await paperRepository.findById(paperId);
    if (!paper || !paper.isActive) throw AppError.notFound('Paper not found');

    const isMember = await workspaceRepository.isMember(
      paper.workspace.toString(),
      userId
    );
    if (!isMember) throw AppError.forbidden('Access denied');

    // Set extraction status to 'processing' and log start time immediately
    await paperRepository.updateExtractionStarted(paperId, new Date());

    // Trigger extraction in the background
    extractionService.extractMetadata(paperId).catch((err) => {
      console.error(`Failed to start retry extraction for paper ${paperId}:`, err);
    });

    const updatedPaper = await paperRepository.findById(paperId);
    return updatedPaper || paper;
  }

  private storeInGridFS(file: Express.Multer.File): Promise<Types.ObjectId> {
    return new Promise((resolve, reject) => {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          uploadedAt: new Date(),
        },
      });

      const readable = Readable.from(file.buffer);

      uploadStream.on('error', reject);
      uploadStream.on('finish', () => resolve(uploadStream.id as Types.ObjectId));

      readable.pipe(uploadStream);
    });
  }
}

export const paperService = new PaperService();
