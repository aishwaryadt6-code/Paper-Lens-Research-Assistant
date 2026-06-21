import { Response, NextFunction } from 'express';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export function auditLog(action: AuditAction, resourceType: string) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) return next();

    try {
      await AuditLog.create({
        actor: new Types.ObjectId(req.user.userId),
        action,
        resourceType,
        resourceId: req.params.id ? new Types.ObjectId(req.params.id) : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { method: req.method, path: req.path },
      });
    } catch (err) {
      logger.warn('Audit log creation failed', { error: err, action });
    }

    next();
  };
}
