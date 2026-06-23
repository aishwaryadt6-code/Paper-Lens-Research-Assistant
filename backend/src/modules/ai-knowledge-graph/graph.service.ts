import { Types } from 'mongoose';
import { Paper } from '../../models/Paper';
import { PaperRelationship } from './relationship.model';
import { logger } from '../../utils/logger';

export interface GraphNode {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  status: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'similarity' | 'contradiction' | 'weak';
  similarityScore: number;
  contradictionScore: number;
  confidenceScore: number;
  reasoningSummary: string;
}

class GraphService {
  /**
   * Fetch nodes and edges for the workspace knowledge graph.
   * Enforces the top 50 relationships limit and supports threshold filters.
   */
  async getWorkspaceGraph(
    workspaceId: string,
    limit = 50,
    threshold = 0.50
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const wId = new Types.ObjectId(workspaceId);

    // 1. Fetch all active ready papers in the workspace
    const allPapers = await Paper.find({
      workspace: wId,
      isActive: true,
      status: 'ready',
    }).select('_id title extractedMetadata status').lean().exec();

    if (allPapers.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Create a map of paper details for easy lookup
    const paperMap = new Map<string, any>();
    for (const paper of allPapers) {
      paperMap.set(paper._id.toString(), paper);
    }

    // 2. Fetch computed relationships for the workspace
    const query: any = { workspaceId: wId };
    
    // Apply threshold filter dynamically
    if (threshold > 0) {
      query.$or = [
        { similarityScore: { $gte: threshold } },
        { contradictionScore: { $gte: threshold } }
      ];
    }

    // Retrieve edges sorted by relevance (highest similarity or contradiction)
    // We sort by similarityScore DESC, contradictionScore DESC
    const dbRelationships = await PaperRelationship.find(query)
      .sort({ similarityScore: -1, contradictionScore: -1 })
      .limit(limit)
      .lean()
      .exec();

    // 3. Collect papers that are actually connected by these top relations
    const connectedPaperIds = new Set<string>();
    const edges: GraphEdge[] = [];

    for (const rel of dbRelationships) {
      const sourceId = rel.sourcePaperId.toString();
      const targetId = rel.targetPaperId.toString();

      // Ensure both papers exist and are active in the workspace
      if (paperMap.has(sourceId) && paperMap.has(targetId)) {
        connectedPaperIds.add(sourceId);
        connectedPaperIds.add(targetId);

        edges.push({
          id: rel._id.toString(),
          source: sourceId,
          target: targetId,
          relationType: rel.relationType,
          similarityScore: rel.similarityScore,
          contradictionScore: rel.contradictionScore,
          confidenceScore: rel.confidenceScore,
          reasoningSummary: rel.reasoningSummary,
        });
      }
    }

    // 4. Construct Nodes List
    const nodes: GraphNode[] = [];
    
    // Scale rule: if there are many papers, only return the connected ones.
    // If the workspace is small (< 20 papers), return all papers to show lone papers as isolated nodes
    const showAllNodes = allPapers.length <= 20;

    for (const paper of allPapers) {
      const pId = paper._id.toString();
      if (showAllNodes || connectedPaperIds.has(pId)) {
        nodes.push({
          id: pId,
          title: paper.title || 'Untitled',
          authors: paper.extractedMetadata?.authors || 'Unknown Authors',
          abstract: paper.extractedMetadata?.abstract || 'No abstract available.',
          status: paper.status,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get related papers for a single paper.
   */
  async getRelatedPapers(paperId: string): Promise<any[]> {
    const pId = new Types.ObjectId(paperId);

    // Find relationships where the paper is either source or target
    const relationships = await PaperRelationship.find({
      $or: [{ sourcePaperId: pId }, { targetPaperId: pId }],
    })
      .populate('sourcePaperId', 'title extractedMetadata')
      .populate('targetPaperId', 'title extractedMetadata')
      .sort({ similarityScore: -1 })
      .lean()
      .exec();

    const related = [];
    for (const rel of relationships) {
      const isSource = rel.sourcePaperId._id.toString() === paperId;
      const otherPaper: any = isSource ? rel.targetPaperId : rel.sourcePaperId;

      if (otherPaper) {
        related.push({
          relationshipId: rel._id.toString(),
          paperId: otherPaper._id.toString(),
          title: otherPaper.title || 'Untitled',
          authors: otherPaper.extractedMetadata?.authors || 'Unknown Authors',
          relationType: rel.relationType,
          similarityScore: rel.similarityScore,
          contradictionScore: rel.contradictionScore,
          confidenceScore: rel.confidenceScore,
          reasoningSummary: rel.reasoningSummary,
        });
      }
    }

    return related;
  }
}

export const graphService = new GraphService();
export default graphService;
