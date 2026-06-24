import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions());
    sendCreated(res, { user, accessToken: tokens.accessToken }, 'Account created successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions());
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Login successful');
  });

  googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const { user, tokens } = await authService.googleAuth(idToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions());
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Google authentication successful');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token not provided' });
      return;
    }
    const tokens = await authService.refreshTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions());
    sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (req.user && refreshToken) {
      await authService.logout(req.user.userId, refreshToken);
    }
    res.clearCookie('refreshToken', cookieOptions());
    sendSuccess(res, null, 'Logged out successfully');
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, { user });
  });
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export const authController = new AuthController();
