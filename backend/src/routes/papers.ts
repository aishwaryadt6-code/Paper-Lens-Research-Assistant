import { Router } from 'express';
import { paperController } from '../controllers/PaperController';
import { authenticate } from '../middlewares/authenticate';
import { uploadMiddleware } from '../middlewares/upload';
import { uploadRateLimiter } from '../middlewares/rateLimiter';
import { auditLog } from '../middlewares/auditLog';

const router = Router();

router.use(authenticate);

// Static routes first — must precede /:id to avoid shadowing
router.get('/', paperController.listAll);
router.get('/recent', paperController.recent);
router.post(
  '/workspaces/:workspaceId/upload',
  uploadRateLimiter,
  uploadMiddleware.single('file'),
  auditLog('paper.upload', 'Paper'),
  paperController.upload
);
router.get('/workspaces/:workspaceId', paperController.list);

// Dynamic :id routes
router.get('/:id/stream', paperController.stream);
router.post('/:id/extract/retry', paperController.retryExtraction);
router.get('/:id/insights', paperController.getInsights);
router.post('/:id/generate-insights', paperController.generateInsights);
router.get('/:id', paperController.getById);
router.delete('/:id', auditLog('paper.delete', 'Paper'), paperController.delete);

export default router;
