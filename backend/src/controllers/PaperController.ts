import { Response } from 'express';
import { paperService } from '../services/PaperService';
import { aiInsightsService } from '../services/AIInsightsService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../utils/AppError';

export class PaperController {
  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paper = await paperService.getPaperById(req.params.id, req.user!.userId);
    sendSuccess(res, { paper });
  });

  upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workspaceId } = req.params;
    if (!req.file) throw AppError.badRequest('No file provided');
    const paper = await paperService.uploadPaper(workspaceId, req.user!.userId, req.file);
    sendCreated(res, { paper }, 'Paper uploaded successfully');
  });

  listAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await paperService.getAllPapers(req.user!.userId, page, limit);
    sendSuccess(res, result);
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workspaceId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await paperService.getPapers(workspaceId, req.user!.userId, page, limit);
    sendSuccess(res, result);
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await paperService.deletePaper(req.params.id, req.user!.userId);
    sendNoContent(res);
  });

  stream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await paperService.streamPaper(req.params.id, req.user!.userId, res);
  });

  recent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const papers = await paperService.getRecentPapers(req.user!.userId);
    sendSuccess(res, { papers });
  });

  retryExtraction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paper = await paperService.retryExtraction(req.params.id, req.user!.userId);
    sendSuccess(res, { paper }, 'Extraction retried successfully');
  });

  getInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await aiInsightsService.getInsights(req.params.id, req.user!.userId);
    sendSuccess(res, result);
  });

  generateInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paper = await aiInsightsService.generateInsights(req.params.id, req.user!.userId);
    sendSuccess(res, { paper }, 'Insights generated successfully');
  });
}

export const paperController = new PaperController();
