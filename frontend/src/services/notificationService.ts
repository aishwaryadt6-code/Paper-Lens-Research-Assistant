import apiClient from './apiClient';
import { Notification, PaginatedResult, ApiResponse } from '../types';

export const notificationService = {
  async list(page = 1, limit = 20): Promise<PaginatedResult<Notification> & { unreadCount: number }> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Notification> & { unreadCount: number }>>(
      '/notifications',
      { params: { page, limit } }
    );
    return res.data.data!;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data!.count;
  },
};
