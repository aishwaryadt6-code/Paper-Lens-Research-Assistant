import { Types } from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { NotificationType } from '../types';

export class NotificationRepository {
  async create(data: {
    recipient: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<INotification> {
    return Notification.create({
      ...data,
      recipient: new Types.ObjectId(data.recipient),
    });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const skip = (page - 1) * limit;
    const filter = { recipient: new Types.ObjectId(userId) };
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(id), recipient: new Types.ObjectId(userId) },
      { $set: { isRead: true } }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}

export const notificationRepository = new NotificationRepository();
