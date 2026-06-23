import { Router } from 'express';
import { graphController } from './graph.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

// Apply auth middleware to all graph routes
router.use(authenticate);

// Workspace routes
router.get('/workspace/:id/graph', graphController.getWorkspaceGraph);
router.post('/workspace/:id/recompute-graph', graphController.recomputeGraph);

// Paper routes
router.get('/paper/:id/relations', graphController.getRelatedPapers);
router.get('/paper/:id/ai-status', graphController.getPaperAIStatus);

export default router;
