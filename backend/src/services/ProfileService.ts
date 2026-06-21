import { userRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/AppError';
import { UpdateProfileDTO } from '../types';
import { IUser } from '../models/User';

export class ProfileService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw AppError.notFound('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<IUser> {
    const updated = await userRepository.updateProfile(userId, dto);
    if (!updated) throw AppError.notFound('User not found');
    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<IUser> {
    const updated = await userRepository.updateAvatar(userId, avatarUrl);
    if (!updated) throw AppError.notFound('User not found');
    return updated;
  }
}

export const profileService = new ProfileService();
