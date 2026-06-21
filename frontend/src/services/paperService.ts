import apiClient from './apiClient';
import { Paper, PaginatedResult, ApiResponse } from '../types';

export const paperService = {
  async upload(
    workspaceId: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<Paper> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<ApiResponse<{ paper: Paper }>>(
      `/papers/workspaces/${workspaceId}/upload`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );
    return res.data.data!.paper;
  },

  async list(
    workspaceId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<Paper>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Paper>>>(
      `/papers/workspaces/${workspaceId}`,
      { params: { page, limit } }
    );
    return res.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/papers/${id}`);
  },

  async getRecent(): Promise<Paper[]> {
    const res = await apiClient.get<ApiResponse<{ papers: Paper[] }>>('/papers/recent');
    return res.data.data!.papers;
  },

  async getById(id: string): Promise<Paper> {
    const res = await apiClient.get<ApiResponse<{ paper: Paper }>>(`/papers/${id}`);
    return res.data.data!.paper;
  },

  getStreamUrl(id: string): string {
    return `/api/papers/${id}/stream`;
  },
};
