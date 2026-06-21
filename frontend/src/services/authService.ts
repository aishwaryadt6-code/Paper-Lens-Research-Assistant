import apiClient from './apiClient';
import { User, ApiResponse } from '../types';

interface AuthData {
  user: User;
  accessToken: string;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthData> {
    const res = await apiClient.post<ApiResponse<AuthData>>('/auth/register', {
      name,
      email,
      password,
    });
    return res.data.data!;
  },

  async login(email: string, password: string): Promise<AuthData> {
    const res = await apiClient.post<ApiResponse<AuthData>>('/auth/login', { email, password });
    return res.data.data!;
  },

  async googleAuth(idToken: string): Promise<AuthData> {
    const res = await apiClient.post<ApiResponse<AuthData>>('/auth/google', { idToken });
    return res.data.data!;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data!.user;
  },

  async refresh(): Promise<string> {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data.data!.accessToken;
  },
};
