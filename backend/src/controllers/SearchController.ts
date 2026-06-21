import { Response } from 'express';
import { searchService } from '../services/SearchService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class SearchController {
  search = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = (req.query.q as string) || '';
    const results = await searchService.globalSearch(query, req.user!.userId);
    sendSuccess(res, results);
  });
}

export const searchController = new SearchController();
