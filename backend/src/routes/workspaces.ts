import { Router } from 'express';
import { workspaceController } from '../controllers/WorkspaceController';
import { authenticate } from '../middlewares/authenticate';
import { auditLog } from '../middlewares/auditLog';
import {
  workspaceValidation,
  inviteMemberValidation,
  validate,
} from '../api/validators';

const router = Router();

router.use(authenticate);

router.get('/', workspaceController.list);

router.post(
  '/',
  workspaceValidation,
  validate,
  auditLog('workspace.create', 'Workspace'),
  workspaceController.create
);

router.get('/:id', workspaceController.get);

router.put(
  '/:id',
  workspaceValidation,
  validate,
  auditLog('workspace.update', 'Workspace'),
  workspaceController.update
);

router.delete(
  '/:id',
  auditLog('workspace.delete', 'Workspace'),
  workspaceController.delete
);

router.post(
  '/:id/members',
  inviteMemberValidation,
  validate,
  auditLog('workspace.invite_member', 'Workspace'),
  workspaceController.inviteMember
);

router.delete(
  '/:id/members/:memberId',
  auditLog('workspace.remove_member', 'Workspace'),
  workspaceController.removeMember
);

export default router;
