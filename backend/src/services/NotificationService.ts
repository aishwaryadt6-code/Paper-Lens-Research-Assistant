import { notificationRepository } from '../repositories/NotificationRepository';
import { INotification } from '../models/Notification';
import { PaginatedResult } from '../types';

export class NotificationService {
  async getNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<INotification> & { unreadCount: number }> {
    const { notifications, total, unreadCount } =
      await notificationRepository.findByUser(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items: notifications,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();
