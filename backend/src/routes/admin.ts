import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticate, authorize } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/active', adminController.setUserActive);
router.patch('/users/:id/role', adminController.setUserRole);

router.get('/workspaces', adminController.listWorkspaces);
router.get('/papers', adminController.listPapers);
router.get('/audit-logs', adminController.listAuditLogs);

export default router;
