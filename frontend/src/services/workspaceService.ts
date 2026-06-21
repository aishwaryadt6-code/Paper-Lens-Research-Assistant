import apiClient from './apiClient';
import { Workspace, ApiResponse } from '../types';

interface CreateWorkspaceData {
  name: string;
  description?: string;
}

interface InviteMemberData {
  email: string;
  role: 'editor' | 'viewer';
}

export const workspaceService = {
  async list(): Promise<Workspace[]> {
    const res = await apiClient.get<ApiResponse<{ workspaces: Workspace[] }>>('/workspaces');
    return res.data.data!.workspaces;
  },

  async get(id: string): Promise<Workspace> {
    const res = await apiClient.get<ApiResponse<{ workspace: Workspace }>>(`/workspaces/${id}`);
    return res.data.data!.workspace;
  },

  async create(data: CreateWorkspaceData): Promise<Workspace> {
    const res = await apiClient.post<ApiResponse<{ workspace: Workspace }>>('/workspaces', data);
    return res.data.data!.workspace;
  },

  async update(id: string, data: Partial<CreateWorkspaceData>): Promise<Workspace> {
    const res = await apiClient.put<ApiResponse<{ workspace: Workspace }>>(
      `/workspaces/${id}`,
      data
    );
    return res.data.data!.workspace;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/workspaces/${id}`);
  },

  async inviteMember(workspaceId: string, data: InviteMemberData): Promise<Workspace> {
    const res = await apiClient.post<ApiResponse<{ workspace: Workspace }>>(
      `/workspaces/${workspaceId}/members`,
      data
    );
    return res.data.data!.workspace;
  },

  async removeMember(workspaceId: string, memberId: string): Promise<Workspace> {
    const res = await apiClient.delete<ApiResponse<{ workspace: Workspace }>>(
      `/workspaces/${workspaceId}/members/${memberId}`
    );
    return res.data.data!.workspace;
  },
};
