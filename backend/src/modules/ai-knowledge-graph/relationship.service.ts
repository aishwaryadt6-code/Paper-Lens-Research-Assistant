import { Types } from 'mongoose';
import { Paper } from '../../models/Paper';
import { PaperRelationship, IPaperRelationship } from './relationship.model';
import { mlClient } from './ml.client';
import { logger } from '../../utils/logger';
import Redis from 'ioredis';

class RelationshipService {
  // In-memory cache for embeddings to satisfy non-interference (no changes to Paper schema)
  private embeddingCache = new Map<string, number[]>();
  private redisClient: Redis | null = null;

  constructor() {
    // Attempt to initialize Redis client if REDIS_URL is configured
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        this.redisClient.on('error', (err) => {
          logger.warn(`Redis connection error for embedding cache: ${err.message}`);
        });
      } catch (e: any) {
        logger.warn(`Could not connect to Redis for embedding cache: ${e.message}`);
      }
    }
  }

  /**
   * Fetch embedding from cache (in-memory or Redis) or compute it.
   */
  async getEmbedding(paperId: string, paperTitle: string, paperMetadata: any): Promise<number[]> {
    const cacheKey = `paper_embedding:${paperId}`;

    // 1. Try In-Memory Cache
    if (this.embeddingCache.has(paperId)) {
      return this.embeddingCache.get(paperId)!;
    }

    // 2. Try Redis Cache
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.embeddingCache.set(paperId, parsed);
          return parsed;
        }
      } catch (err: any) {
        logger.warn(`Failed to read embedding from Redis cache: ${err.message}`);
      }
    }

    // 3. Generate new embedding from text
    const abstract = paperMetadata?.abstract || '';
    const keywords = paperMetadata?.keywords || '';
    const conclusion = paperMetadata?.conclusion || '';
    const textToEmbed = `Title: ${paperTitle}\nAbstract: ${abstract}\nKeywords: ${keywords}\nConclusion: ${conclusion}`;

    logger.info(`Computing new embedding for paper ${paperId}`);
    const embedding = await mlClient.getEmbedding(textToEmbed);

    // 4. Save to caches
    this.embeddingCache.set(paperId, embedding);
    if (this.redisClient && embedding && embedding.length > 0 && embedding.some(v => v !== 0)) {
      try {
        // Cache embedding for 30 days
        await this.redisClient.set(cacheKey, JSON.stringify(embedding), 'EX', 60 * 60 * 24 * 30);
      } catch (err: any) {
        logger.warn(`Failed to write embedding to Redis cache: ${err.message}`);
      }
    }

    return embedding;
  }

  /**
   * Compute relationship between two papers and store/upsert in paper_relationships.
   */
  async computeRelationship(
    p1: any,
    p2: any,
    workspaceId: string
  ): Promise<IPaperRelationship | null> {
    const id1 = p1._id.toString();
    const id2 = p2._id.toString();

    // Canonical ordering: sourceId is smaller than targetId lexicographically
    const isOrdered = id1 < id2;
    const sourcePaper = isOrdered ? p1 : p2;
    const targetPaper = isOrdered ? p2 : p1;
    const sourcePaperId = sourcePaper._id;
    const targetPaperId = targetPaper._id;

    try {
      const emb1 = await this.getEmbedding(p1._id.toString(), p1.title, p1.extractedMetadata);
      const emb2 = await this.getEmbedding(p2._id.toString(), p2.title, p2.extractedMetadata);

      // Compute similarity
      const similarityScore = await mlClient.calculateSimilarity(emb1, emb2);

      // We only run NLI contradiction if there's at least a weak similarity threshold
      // or if they are candidates for relationship
      let contradictionScore = 0.0;
      let confidenceScore = 1.0;
      let relationType: 'similarity' | 'contradiction' | 'weak' = 'weak';
      let reasoningSummary = '';

      if (similarityScore >= 0.50) {
        const text1 = `${p1.extractedMetadata?.abstract || ''} ${p1.extractedMetadata?.conclusion || ''}`;
        const text2 = `${p2.extractedMetadata?.abstract || ''} ${p2.extractedMetadata?.conclusion || ''}`;

        const nliRes = await mlClient.detectContradiction(text1, text2);
        contradictionScore = nliRes.contradiction_score;
        confidenceScore = nliRes.confidence_score;

        // Apply rules
        if (contradictionScore > 0.60) {
          relationType = 'contradiction';
        } else if (similarityScore > 0.75) {
          relationType = 'similarity';
        } else {
          relationType = 'weak';
        }

        // Build a readable explanation
        const kw1 = new Set(p1.extractedMetadata?.keywords?.toLowerCase().split(',') || []);
        const kw2 = new Set(p2.extractedMetadata?.keywords?.toLowerCase().split(',') || []);
        const overlap = Array.from(kw1).filter(k => kw2.has(k) && k.trim());

        if (relationType === 'contradiction') {
          reasoningSummary = `Potential contradiction detected (score: ${contradictionScore.toFixed(2)}). `;
          if (overlap.length > 0) {
            reasoningSummary += `While both publications address themes of '${overlap[0]}', they present opposing results or conflicting conclusions.`;
          } else {
            reasoningSummary += `The papers present conflicting claims or methodological disagreements on related outcomes.`;
          }
        } else if (relationType === 'similarity') {
          reasoningSummary = `Strong similarity detected (score: ${similarityScore.toFixed(2)}). `;
          if (overlap.length > 0) {
            reasoningSummary += `Both publications share significant semantic alignment on '${overlap.slice(0, 3).join(', ')}' and share similar methodological objectives.`;
          } else {
            reasoningSummary += `The publications have closely aligned methodologies and overlapping conclusions.`;
          }
        } else {
          reasoningSummary = `Weak thematic link (score: ${similarityScore.toFixed(2)}). `;
          if (overlap.length > 0) {
            reasoningSummary += `The papers share minor semantic focus on '${overlap[0]}'.`;
          } else {
            reasoningSummary += `Small degree of methodology overlap.`;
          }
        }
      } else {
        // Below threshold: remove any existing relationship to save storage
        await PaperRelationship.findOneAndDelete({ sourcePaperId, targetPaperId });
        return null;
      }

      // Upsert the relationship
      const relationship = await PaperRelationship.findOneAndUpdate(
        { sourcePaperId, targetPaperId },
        {
          $set: {
            relationType,
            similarityScore,
            contradictionScore,
            confidenceScore,
            reasoningSummary,
            workspaceId: new Types.ObjectId(workspaceId),
          },
        },
        { upsert: true, new: true }
      );

      return relationship;
    } catch (err: any) {
      logger.warn(`Failed to compute relationship between ${id1} and ${id2}: ${err.message}`);
      return null;
    }
  }

  /**
   * Precompute all pairwise relationships for a workspace.
   */
  async precomputeWorkspace(workspaceId: string): Promise<void> {
    logger.info(`Starting relationship precomputation for workspace ${workspaceId}`);
    
    // Fetch all active, ready papers in the workspace
    const papers = await Paper.find({
      workspace: new Types.ObjectId(workspaceId),
      isActive: true,
      status: 'ready',
    }).exec();

    const numPapers = papers.length;
    if (numPapers <= 1) {
      logger.info(`Workspace ${workspaceId} has too few papers (${numPapers}). Skipping precomputation.`);
      return;
    }

    logger.info(`Found ${numPapers} papers to process in workspace ${workspaceId}`);

    // Compute pairwise relationships
    for (let i = 0; i < numPapers; i++) {
      for (let j = i + 1; j < numPapers; j++) {
        await this.computeRelationship(papers[i], papers[j], workspaceId);
      }
    }
    
    logger.info(`Precomputation completed for workspace ${workspaceId}`);
  }

  /**
   * Delete relationships for a deleted paper.
   */
  async deletePaperRelationships(paperId: string): Promise<void> {
    const oid = new Types.ObjectId(paperId);
    await PaperRelationship.deleteMany({
      $or: [{ sourcePaperId: oid }, { targetPaperId: oid }],
    }).exec();
  }
}

export const relationshipService = new RelationshipService();
export default relationshipService;
