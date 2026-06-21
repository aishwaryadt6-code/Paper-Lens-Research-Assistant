import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { paperRepository } from '../repositories/PaperRepository';

export interface SearchResults {
  workspaces: unknown[];
  papers: unknown[];
}

export class SearchService {
  async globalSearch(query: string, userId: string): Promise<SearchResults> {
    if (!query || query.trim().length < 2) {
      return { workspaces: [], papers: [] };
    }

    const trimmed = query.trim();
    const [workspaces, papers] = await Promise.all([
      workspaceRepository.search(trimmed, userId),
      this.searchUserPapers(trimmed, userId),
    ]);

    return { workspaces, papers };
  }

  private async searchUserPapers(query: string, userId: string): Promise<unknown[]> {
    const userWorkspaces = await workspaceRepository.findByUser(userId);
    if (!userWorkspaces.length) return [];

    const searches = userWorkspaces.map((ws) =>
      paperRepository.search(query, ws._id.toString())
    );

    const results = await Promise.all(searches);
    return results.flat().slice(0, 10);
  }
}

export const searchService = new SearchService();
