import { Response } from 'express';
import { workspaceService } from '../services/WorkspaceService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class WorkspaceController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspaces = await workspaceService.getUserWorkspaces(req.user!.userId);
    sendSuccess(res, { workspaces });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspace = await workspaceService.createWorkspace(req.user!.userId, req.body);
    sendCreated(res, { workspace }, 'Workspace created successfully');
  });

  get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspace = await workspaceService.getWorkspace(
      req.params.id,
      req.user!.userId
    );
    sendSuccess(res, { workspace });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspace = await workspaceService.updateWorkspace(
      req.params.id,
      req.user!.userId,
      req.body
    );
    sendSuccess(res, { workspace }, 'Workspace updated successfully');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await workspaceService.deleteWorkspace(req.params.id, req.user!.userId);
    sendNoContent(res);
  });

  inviteMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspace = await workspaceService.inviteMember(
      req.params.id,
      req.user!.userId,
      req.body
    );
    sendSuccess(res, { workspace }, 'Member invited successfully');
  });

  removeMember = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspace = await workspaceService.removeMember(
      req.params.id,
      req.user!.userId,
      req.params.memberId
    );
    sendSuccess(res, { workspace }, 'Member removed successfully');
  });
}

export const workspaceController = new WorkspaceController();
