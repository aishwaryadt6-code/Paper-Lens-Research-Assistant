import { logger } from '../../utils/logger';

export interface MLEmbeddingRequest {
  text: string;
}

export interface MLEmbeddingResponse {
  embedding: number[];
}

export interface MLSimilarityRequest {
  vector1: number[];
  vector2: number[];
}

export interface MLSimilarityResponse {
  similarity: number;
}

export interface MLContradictionRequest {
  text1: string;
  text2: string;
}

export interface MLContradictionResponse {
  contradiction_score: number;
  confidence_score: number;
  label: string;
}

export interface MLPaperInput {
  id: string;
  title: string;
  abstract: string;
  keywords: string;
  conclusion: string;
  embedding?: number[];
}

export interface MLGraphRequest {
  papers: MLPaperInput[];
  similarity_threshold?: number;
}

export interface MLGraphEdge {
  sourcePaperId: string;
  targetPaperId: string;
  relationType: 'similarity' | 'contradiction' | 'weak';
  similarityScore: number;
  contradictionScore: number;
  confidenceScore: number;
  reasoningSummary: string;
}

export interface MLGraphNode {
  id: string;
  title: string;
  authors?: string;
  abstract?: string;
}

export interface MLGraphResponse {
  nodes: MLGraphNode[];
  edges: MLGraphEdge[];
}

class MLClient {
  private baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  private defaultTimeoutMs = 15000; // 15 seconds for heavy model loadings

  private async post<T>(path: string, body: any, fallbackValue: T): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        logger.warn(`ML service error at [POST ${path}]: Status ${response.status} ${response.statusText}`);
        return fallbackValue;
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        logger.warn(`ML service request timed out at [POST ${path}]`);
      } else {
        logger.warn(`ML service is unavailable or returned network error at [POST ${path}]: ${err.message}`);
      }
      return fallbackValue;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const fallback = new Array(384).fill(0); // 384-dimensional zero vector fallback
    const res = await this.post<MLEmbeddingResponse>('/embeddings', { text }, { embedding: fallback });
    return res.embedding;
  }

  async calculateSimilarity(vector1: number[], vector2: number[]): Promise<number> {
    const res = await this.post<MLSimilarityResponse>('/similarity', { vector1, vector2 }, { similarity: 0.0 });
    return res.similarity;
  }

  async detectContradiction(text1: string, text2: string): Promise<MLContradictionResponse> {
    const fallback: MLContradictionResponse = {
      contradiction_score: 0.0,
      confidence_score: 1.0,
      label: 'neutral',
    };
    return this.post<MLContradictionResponse>('/contradiction', { text1, text2 }, fallback);
  }

  async generateGraph(papers: MLPaperInput[], similarityThreshold = 0.50): Promise<MLGraphResponse> {
    const fallback: MLGraphResponse = {
      nodes: papers.map(p => ({ id: p.id, title: p.title, abstract: p.abstract })),
      edges: [],
    };
    return this.post<MLGraphResponse>('/graph', { papers, similarity_threshold: similarityThreshold }, fallback);
  }
}

export const mlClient = new MLClient();
export default mlClient;
