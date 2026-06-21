import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { auditLog } from '../middlewares/auditLog';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../api/validators';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  validate,
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validate,
  auditLog('user.login', 'User'),
  authController.login
);

router.post('/google', authRateLimiter, authController.googleAuth);

router.post('/refresh', authController.refresh);

router.post('/logout', authenticate, auditLog('user.logout', 'User'), authController.logout);

router.get('/me', authenticate, authController.me);

export default router;
