import { Response } from 'express';
import { adminService } from '../services/AdminService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AdminController {
  getStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const stats = await adminService.getStats();
    sendSuccess(res, stats);
  });

  listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await adminService.listUsers(page, limit);
    sendSuccess(res, result);
  });

  getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminService.getUser(req.params.id);
    sendSuccess(res, { user });
  });

  setUserActive = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { isActive } = req.body;
    const user = await adminService.setUserActive(req.params.id, Boolean(isActive));
    sendSuccess(res, { user }, `User ${isActive ? 'activated' : 'deactivated'}`);
  });

  setUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { role } = req.body;
    const user = await adminService.setUserRole(req.params.id, role);
    sendSuccess(res, { user }, 'User role updated');
  });

  listWorkspaces = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await adminService.listWorkspaces(page, limit);
    sendSuccess(res, result);
  });

  listPapers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await adminService.listPapers(page, limit);
    sendSuccess(res, result);
  });

  listAuditLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await adminService.listAuditLogs(page, limit);
    sendSuccess(res, result);
  });
}

export const adminController = new AdminController();
