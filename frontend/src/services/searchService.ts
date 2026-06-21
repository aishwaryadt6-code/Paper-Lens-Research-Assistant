import apiClient from './apiClient';
import { ApiResponse, Workspace, Paper } from '../types';

export interface SearchResults {
  workspaces: Workspace[];
  papers: Paper[];
}

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    const res = await apiClient.get<ApiResponse<SearchResults>>('/search', {
      params: { q: query },
    });
    return res.data.data!;
  },
};
