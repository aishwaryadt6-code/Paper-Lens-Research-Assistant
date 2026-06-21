import { Router } from 'express';
import { profileController } from '../controllers/ProfileController';
import { authenticate } from '../middlewares/authenticate';
import { auditLog } from '../middlewares/auditLog';
import { updateProfileValidation, validate } from '../api/validators';

const router = Router();

router.use(authenticate);

router.get('/', profileController.get);

router.put(
  '/',
  updateProfileValidation,
  validate,
  auditLog('user.update_profile', 'User'),
  profileController.update
);

export default router;
