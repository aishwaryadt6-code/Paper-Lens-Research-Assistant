import { Types } from 'mongoose';
import { User, IUser } from '../models/User';
import { UpdateProfileDTO } from '../types';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async findByIdWithTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+passwordHash +refreshTokens').exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).exec();
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async updateProfile(id: string, data: UpdateProfileDTO): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: { avatarUrl } },
      { new: true }
    ).exec();
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      $push: { refreshTokens: token },
      $set: { lastLoginAt: new Date() },
    }).exec();
  }

  async removeRefreshToken(id: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      $pull: { refreshTokens: token },
    }).exec();
  }

  async removeAllRefreshTokens(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      $set: { refreshTokens: [] },
    }).exec();
  }

  async findAll(page: number, limit: number): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({ isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      User.countDocuments({ isActive: true }),
    ]);
    return { users, total };
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async setGoogleId(id: string, googleId: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $set: { googleId, isEmailVerified: true } }).exec();
  }
}

export const userRepository = new UserRepository();
