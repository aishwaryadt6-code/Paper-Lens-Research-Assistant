import { Types } from 'mongoose';
import { Paper } from '../models/Paper';
import { PaperAIResult } from '../models/PaperAIResult';
import { PaperRelationship } from '../modules/ai-knowledge-graph/relationship.model';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const ML_URL = config.mlServiceUrl;
const TIMEOUT_MS = 15000; // 15 seconds

export class AutoAIPipelineService {
  private activeJobs = new Set<string>();

  /**
   * Initializes a pending job entry for a paper.
   */
  async initializeJob(paperId: string, workspaceId: string): Promise<void> {
    try {
      await PaperAIResult.findOneAndUpdate(
        { paperId: new Types.ObjectId(paperId) },
        {
          $set: {
            workspaceId: new Types.ObjectId(workspaceId),
            jobStatus: 'pending',
          },
        },
        { upsert: true, new: true }
      );
      logger.info(`[AutoAIPipelineService] Job initialized as pending for paper: ${paperId}`);
    } catch (err: any) {
      logger.error(`[AutoAIPipelineService] Failed to initialize job: ${err.message}`);
    }
  }

  /**
   * Runs similarity, contradiction, and graph pipelines for a paper.
   */
  async runPipelineForPaper(paperId: string, workspaceId: string): Promise<void> {
    if (this.activeJobs.has(paperId)) {
      logger.info(`[AutoAIPipelineService] Job already running for paper: ${paperId}. Skipping.`);
      return;
    }

    this.activeJobs.add(paperId);

    try {
      // 1. Mark status as processing
      await PaperAIResult.findOneAndUpdate(
        { paperId: new Types.ObjectId(paperId) },
        { $set: { jobStatus: 'processing' } }
      );

      // 2. Fetch target paper
      const currentPaper = await Paper.findById(paperId).exec();
      if (!currentPaper) {
        throw new Error('Paper not found');
      }

      const currentAbstract = currentPaper.extractedMetadata?.abstract || '';
      if (!currentAbstract.trim()) {
        logger.warn(`[AutoAIPipelineService] Paper abstract is empty. Skipping analysis.`);
        await PaperAIResult.findOneAndUpdate(
          { paperId: new Types.ObjectId(paperId) },
          {
            $set: {
              jobStatus: 'completed',
              lastProcessedAt: new Date(),
            },
          }
        );
        this.activeJobs.delete(paperId);
        return;
      }

      // 3. Fetch all other active ready papers in the workspace
      const otherPapers = await Paper.find({
        workspace: new Types.ObjectId(workspaceId),
        _id: { $ne: new Types.ObjectId(paperId) },
        isActive: true,
        status: 'ready',
      }).exec();

      logger.info(
        `[AutoAIPipelineService] Running pipeline for paper ${paperId} against ${otherPapers.length} papers.`
      );

      const similarityResults: Record<string, number> = {};
      const contradictionResults: Record<
        string,
        { contradiction_score: number; confidence_score: number; label: string }
      > = {};

      // 4. Pairwise similarity & contradiction
      for (const other of otherPapers) {
        const otherAbstract = other.extractedMetadata?.abstract || '';
        if (!otherAbstract.trim()) continue;

        const otherId = other._id.toString();

        // Similarity call
        const similarityScore = await this.callMLService<number>(
          '/similarity',
          { text1: currentAbstract, text2: otherAbstract },
          0.0,
          (data) => data.similarity
        );
        similarityResults[otherId] = similarityScore;

        // Contradiction call
        const contradictionRes = await this.callMLService<any>(
          '/contradiction',
          { text1: currentAbstract, text2: otherAbstract },
          { contradiction_score: 0.0, confidence_score: 1.0, label: 'neutral' },
          (data) => data
        );
        contradictionResults[otherId] = contradictionRes;
      }

      // 5. Workspace graph uvicorn call
      const allPapers = await Paper.find({
        workspace: new Types.ObjectId(workspaceId),
        isActive: true,
        status: 'ready',
      }).exec();

      const formattedPapers = allPapers.map((p) => ({
        id: p._id.toString(),
        title: p.title || 'Untitled',
        abstract: p.extractedMetadata?.abstract || '',
        keywords: p.extractedMetadata?.keywords || '',
        conclusion: p.extractedMetadata?.conclusion || '',
        authors: p.extractedMetadata?.authors || '',
      }));

      const graphData = await this.callMLService<any>(
        '/graph',
        { papers: formattedPapers },
        { nodes: [], edges: [] },
        (data) => data
      );

      // Save edges inside PaperAIResult
      const graphEdges = graphData.edges || [];

      // 6. Update PaperRelationships workspace cache
      for (const edge of graphEdges) {
        const sourceId = new Types.ObjectId(edge.sourcePaperId);
        const targetId = new Types.ObjectId(edge.targetPaperId);

        await PaperRelationship.findOneAndUpdate(
          { sourcePaperId: sourceId, targetPaperId: targetId },
          {
            $set: {
              relationType: edge.relationType,
              similarityScore: edge.similarityScore,
              contradictionScore: edge.contradictionScore,
              confidenceScore: edge.confidenceScore,
              reasoningSummary: edge.reasoningSummary,
              workspaceId: new Types.ObjectId(workspaceId),
            },
          },
          { upsert: true }
        );
      }

      // 7. Store results and mark jobStatus completed
      await PaperAIResult.findOneAndUpdate(
        { paperId: new Types.ObjectId(paperId) },
        {
          $set: {
            similarityResults,
            contradictionResults,
            graphEdges,
            jobStatus: 'completed',
            lastProcessedAt: new Date(),
          },
        }
      );
      logger.info(`[AutoAIPipelineService] Job completed for paper: ${paperId}`);
    } catch (err: any) {
      logger.error(`[AutoAIPipelineService] Job failed for paper ${paperId}: ${err.message}`);
      await PaperAIResult.findOneAndUpdate(
        { paperId: new Types.ObjectId(paperId) },
        {
          $set: {
            jobStatus: 'failed',
            lastProcessedAt: new Date(),
          },
        }
      );
    } finally {
      this.activeJobs.delete(paperId);
    }
  }

  /**
   * Helper to perform uvicorn fetch requests with timeout handling.
   */
  private async callMLService<T>(
    path: string,
    body: any,
    fallback: T,
    extractor: (res: any) => T
  ): Promise<T> {
    const url = `${ML_URL}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        logger.warn(`[AutoAIPipelineService] ML endpoint ${path} returned status ${response.status}`);
        return fallback;
      }

      const data = await response.json();
      return extractor(data);
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        logger.warn(`[AutoAIPipelineService] ML endpoint ${path} timed out`);
      } else {
        logger.warn(`[AutoAIPipelineService] ML endpoint ${path} failed: ${err.message}`);
      }
      return fallback;
    }
  }

  /**
   * Delete job entry for a paper.
   */
  async deleteJob(paperId: string): Promise<void> {
    try {
      await PaperAIResult.deleteOne({ paperId: new Types.ObjectId(paperId) });
    } catch (err: any) {
      logger.error(`[AutoAIPipelineService] Failed to delete job: ${err.message}`);
    }
  }
}

export const autoAIPipelineService = new AutoAIPipelineService();
export default autoAIPipelineService;
