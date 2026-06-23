import { Response } from 'express';
import { graphService } from './graph.service';
import { relationshipService } from './relationship.service';
import { workspaceRepository } from '../../repositories/WorkspaceRepository';
import { Paper } from '../../models/Paper';
import { PaperAIResult } from '../../models/PaperAIResult';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../types';

export class GraphController {
  /**
   * Get workspace knowledge graph nodes and edges.
   * Route: GET /api/ai-knowledge-graph/workspace/:id/graph
   */
  getWorkspaceGraph = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspaceId = req.params.id;
    const userId = req.user!.userId;

    // Check workspace membership
    const isMember = await workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this workspace');
    }

    // Parse options
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 0.50;

    const graphData = await graphService.getWorkspaceGraph(workspaceId, limit, threshold);
    sendSuccess(res, graphData);
  });

  /**
   * Get related papers for a single paper.
   * Route: GET /api/ai-knowledge-graph/paper/:id/relations
   */
  getRelatedPapers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paperId = req.params.id;
    const userId = req.user!.userId;

    // Find the paper to check workspace membership
    const paper = await Paper.findById(paperId).exec();
    if (!paper || !paper.isActive) {
      throw AppError.notFound('Paper not found');
    }

    const isMember = await workspaceRepository.isMember(paper.workspace.toString(), userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this paper');
    }

    const relations = await graphService.getRelatedPapers(paperId);
    sendSuccess(res, { relations });
  });

  /**
   * Recompute graph relationships for a workspace.
   * Route: POST /api/ai-knowledge-graph/workspace/:id/recompute-graph
   */
  recomputeGraph = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workspaceId = req.params.id;
    const userId = req.user!.userId;

    // Check workspace membership
    const isMember = await workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this workspace');
    }

    // Run recomputation asynchronously in the background so API stays fast
    relationshipService.precomputeWorkspace(workspaceId)
      .catch((err) => {
        console.error(`[GraphController] Background precomputation failed for workspace ${workspaceId}:`, err);
      });

    sendSuccess(res, null, 'Graph recomputation triggered successfully in the background');
  });

  /**
   * Get AI job status and results for a single paper.
   * Route: GET /api/ai-knowledge-graph/paper/:id/ai-status
   */
  getPaperAIStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paperId = req.params.id;
    const userId = req.user!.userId;

    const paper = await Paper.findById(paperId).exec();
    if (!paper || !paper.isActive) {
      throw AppError.notFound('Paper not found');
    }

    const isMember = await workspaceRepository.isMember(paper.workspace.toString(), userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this paper');
    }

    let aiResult = await PaperAIResult.findOne({ paperId: paper._id }).exec();
    if (!aiResult) {
      aiResult = await PaperAIResult.create({
        paperId: paper._id,
        workspaceId: paper.workspace,
        jobStatus: 'pending',
      });
    }

    sendSuccess(res, aiResult);
  });
}

export const graphController = new GraphController();
export default graphController;
