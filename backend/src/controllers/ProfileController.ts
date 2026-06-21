import { Response } from 'express';
import { profileService } from '../services/ProfileService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class ProfileController {
  get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await profileService.getProfile(req.user!.userId);
    sendSuccess(res, { user });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await profileService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, { user }, 'Profile updated successfully');
  });
}

export const profileController = new ProfileController();
