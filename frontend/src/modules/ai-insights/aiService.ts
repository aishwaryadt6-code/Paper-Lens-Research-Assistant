import axios from 'axios';

const ML_URL = "http://localhost:8000"
const TIMEOUT = 30000; // 10-second timeout

export interface GraphNode {
  id: string;
  title: string;
  authors?: string;
  abstract?: string;
}

export interface GraphEdge {
  sourcePaperId: string;
  targetPaperId: string;
  relationType: 'similarity' | 'contradiction' | 'weak';
  similarityScore: number;
  contradictionScore: number;
  confidenceScore: number;
  reasoningSummary: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const postWithRetry = async (url: string, data: any, retries = 1): Promise<any> => {
  try {
    return await axios.post(url, data, { timeout: TIMEOUT });
  } catch (error) {
    if (retries > 0) {
      console.warn(`[aiService] retrying... ${url}`);
      return await postWithRetry(url, data, retries - 1);
    }
    throw error;
  }
};

export const aiService = {
  /**
   * Compare two texts and return similarity score (fallback to 0).
   */
  async similarity(text1: string, text2: string): Promise<number> {
    try {
      const response = await postWithRetry(`${ML_URL}/similarity`, { text1, text2 });
      return response.data?.similarity ?? 0;
    } catch (error) {
      console.warn('[aiService] Similarity call failed or timed out after retries:', error);
      return 0; // Fallback
    }
  },

  /**
   * Check contradiction between two texts (fallback to unknown).
   */
  async contradiction(
    text1: string,
    text2: string
  ): Promise<{ contradiction_score: number; confidence_score: number; label: string }> {
    try {
      const response = await postWithRetry(`${ML_URL}/contradiction`, { text1, text2 });
      return (
        response.data ?? {
          contradiction_score: 0,
          confidence_score: 0,
          label: 'unknown',
        }
      );
    } catch (error) {
      console.warn('[aiService] Contradiction call failed or timed out after retries:', error);
      return { contradiction_score: 0, confidence_score: 1.0, label: 'unknown' }; // Fallback
    }
  },

  /**
   * Generate knowledge graph from papers list (fallback to empty node/edge list).
   */
  async generateGraph(papers: any[]): Promise<GraphResponse> {
    try {
      const formattedPapers = papers.map((p) => ({
        id: p._id || p.id,
        title: p.title || 'Untitled',
        abstract: p.extractedMetadata?.abstract || p.abstract || '',
        keywords: p.extractedMetadata?.keywords || p.keywords || '',
        conclusion: p.extractedMetadata?.conclusion || p.conclusion || '',
        authors: p.extractedMetadata?.authors || p.authors || '',
      }));

      const response = await postWithRetry(`${ML_URL}/graph`, { papers: formattedPapers });
      return response.data ?? { nodes: [], edges: [] };
    } catch (error) {
      console.warn('[aiService] Graph generation failed or timed out after retries:', error);
      return { nodes: [], edges: [] }; // Fallback
    }
  },
};

export default aiService;
