import { Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class NotificationController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await notificationService.getNotifications(req.user!.userId, page, limit);
    sendSuccess(res, result);
  });

  markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.markAsRead(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Notification marked as read');
  });

  markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, null, 'All notifications marked as read');
  });

  unreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, { count });
  });
}

export const notificationController = new NotificationController();
