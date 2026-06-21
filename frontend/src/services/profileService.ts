import apiClient from './apiClient';
import { User, ApiResponse, Theme } from '../types';

interface UpdateProfileData {
  name?: string;
  bio?: string;
  settings?: {
    theme?: Theme;
    language?: string;
    notifications?: { email?: boolean; inApp?: boolean };
  };
}

export const profileService = {
  async get(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/profile');
    return res.data.data!.user;
  },

  async update(data: UpdateProfileData): Promise<User> {
    const res = await apiClient.put<ApiResponse<{ user: User }>>('/profile', data);
    return res.data.data!.user;
  },
};
