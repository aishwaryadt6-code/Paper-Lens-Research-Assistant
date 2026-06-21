import apiClient from './apiClient';
import { ApiResponse, User, Workspace, Paper } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalPapers: number;
  activeUsers: number;
}

export interface AuditLog {
  _id: string;
  actor: User | string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data.data!;
  },

  async listUsers(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const res = await apiClient.get<ApiResponse<{ users: User[]; total: number }>>('/admin/users', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  async setUserActive(id: string, isActive: boolean): Promise<User> {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>(`/admin/users/${id}/active`, { isActive });
    return res.data.data!.user;
  },

  async setUserRole(id: string, role: 'researcher' | 'admin'): Promise<User> {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>(`/admin/users/${id}/role`, { role });
    return res.data.data!.user;
  },

  async listWorkspaces(page = 1, limit = 20): Promise<{ workspaces: Workspace[]; total: number }> {
    const res = await apiClient.get<ApiResponse<{ workspaces: Workspace[]; total: number }>>('/admin/workspaces', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  async listPapers(page = 1, limit = 20): Promise<{ papers: Paper[]; total: number }> {
    const res = await apiClient.get<ApiResponse<{ papers: Paper[]; total: number }>>('/admin/papers', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  async listAuditLogs(page = 1, limit = 50): Promise<{ logs: AuditLog[]; total: number }> {
    const res = await apiClient.get<ApiResponse<{ logs: AuditLog[]; total: number }>>('/admin/audit-logs', {
      params: { page, limit },
    });
    return res.data.data!;
  },
};
