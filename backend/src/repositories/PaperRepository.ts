import { Types } from 'mongoose';
import { Paper, IPaper } from '../models/Paper';

export class PaperRepository {
  async create(data: Partial<IPaper>): Promise<IPaper> {
    return Paper.create(data);
  }

  async findById(id: string): Promise<IPaper | null> {
    return Paper.findById(id).populate('uploadedBy', 'name email').exec();
  }

  async findByWorkspace(
    workspaceId: string,
    page: number,
    limit: number
  ): Promise<{ papers: IPaper[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { workspace: new Types.ObjectId(workspaceId), isActive: true };
    const [papers, total] = await Promise.all([
      Paper.find(filter)
        .populate('uploadedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Paper.countDocuments(filter),
    ]);
    return { papers, total };
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ papers: IPaper[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { uploadedBy: new Types.ObjectId(userId), isActive: true };
    const [papers, total] = await Promise.all([
      Paper.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Paper.countDocuments(filter),
    ]);
    return { papers, total };
  }

  async findByChecksum(checksum: string, workspaceId: string): Promise<IPaper | null> {
    return Paper.findOne({
      checksum,
      workspace: new Types.ObjectId(workspaceId),
      isActive: true,
    }).exec();
  }

  async updateStatus(id: string, status: IPaper['status'], error?: string): Promise<void> {
    await Paper.findByIdAndUpdate(id, {
      $set: { status, ...(error ? { processingError: error } : {}) },
    }).exec();
  }

  async updateExtractionStarted(id: string, startedAt: Date): Promise<void> {
    await Paper.findByIdAndUpdate(id, {
      $set: {
        extractionStatus: 'processing',
        extractionStartedAt: startedAt,
        extractionError: null,
      },
    }).exec();
  }

  async updateExtractedMetadata(
    id: string,
    data: {
      metadata: IPaper['extractedMetadata'];
      diagnostics?: IPaper['parserDiagnostics'];
      pageCount: number;
      completedAt: Date;
      version: number;
    }
  ): Promise<void> {
    await Paper.findByIdAndUpdate(id, {
      $set: {
        extractedMetadata: data.metadata,
        parserDiagnostics: data.diagnostics,
        pageCount: data.pageCount,
        extractionStatus: 'completed',
        extractionCompletedAt: data.completedAt,
        extractionVersion: data.version,
      },
    }).exec();
  }

  async updateExtractionFailed(id: string, error: string): Promise<void> {
    await Paper.findByIdAndUpdate(id, {
      $set: {
        extractionStatus: 'failed',
        extractionError: error,
      },
    }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await Paper.findByIdAndUpdate(id, { $set: { isActive: false } }).exec();
  }

  async hardDelete(id: string): Promise<void> {
    await Paper.findByIdAndDelete(id).exec();
  }

  async search(query: string, workspaceId: string): Promise<IPaper[]> {
    return Paper.find({
      $text: { $search: query },
      workspace: new Types.ObjectId(workspaceId),
      isActive: true,
    })
      .limit(10)
      .exec();
  }

  async getRecentByUser(userId: string, limit = 5): Promise<IPaper[]> {
    return Paper.find({ uploadedBy: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('workspace', 'name')
      .exec();
  }
}

export const paperRepository = new PaperRepository();
