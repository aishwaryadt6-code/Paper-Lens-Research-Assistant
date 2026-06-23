import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../aiService';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

describe('aiService Integration Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('similarity', () => {
    it('returns score on successful API response', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { similarity: 0.82 } });
      const score = await aiService.similarity('text A', 'text B');
      expect(score).toBe(0.82);
    });

    it('returns 0 fallback score on API network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      const score = await aiService.similarity('text A', 'text B');
      expect(score).toBe(0);
    });

    it('returns 0 fallback score on API timeout', async () => {
      mockedAxios.post.mockRejectedValueOnce({ code: 'ECONNABORTED' });
      const score = await aiService.similarity('text A', 'text B');
      expect(score).toBe(0);
    });
  });

  describe('contradiction', () => {
    it('returns score and label on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { contradiction_score: 0.72, confidence_score: 0.85, label: 'contradiction' }
      });
      const res = await aiService.contradiction('text A', 'text B');
      expect(res.contradiction_score).toBe(0.72);
      expect(res.label).toBe('contradiction');
    });

    it('returns unknown fallback on API network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Internal server error'));
      const res = await aiService.contradiction('text A', 'text B');
      expect(res.contradiction_score).toBe(0);
      expect(res.label).toBe('unknown');
    });
  });

  describe('generateGraph', () => {
    it('formats input papers and returns nodes and edges on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          nodes: [{ id: '1', title: 'Paper 1' }],
          edges: [{ sourcePaperId: '1', targetPaperId: '2', relationType: 'similarity' }]
        }
      });

      const res = await aiService.generateGraph([
        { _id: '1', title: 'Paper 1', extractedMetadata: { abstract: 'Abs 1' } }
      ]);

      expect(res.nodes.length).toBe(1);
      expect(res.edges.length).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/graph'),
        expect.objectContaining({
          papers: [
            expect.objectContaining({ id: '1', title: 'Paper 1', abstract: 'Abs 1' })
          ]
        }),
        expect.anything()
      );
    });

    it('returns empty collections fallback on API downtime', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Connection refused'));
      const res = await aiService.generateGraph([]);
      expect(res.nodes).toEqual([]);
      expect(res.edges).toEqual([]);
    });
  });
});
