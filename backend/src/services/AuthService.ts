import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { userRepository } from '../repositories/UserRepository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { RegisterDTO, LoginDTO } from '../types';
import { IUser } from '../models/User';

const googleClient = new OAuth2Client(config.google.clientId);

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: IUser;
  tokens: AuthTokens;
}

export class AuthService {
  async register(dto: RegisterDTO): Promise<AuthResult> {
    const exists = await userRepository.existsByEmail(dto.email);
    if (exists) {
      throw AppError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await userRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      isEmailVerified: false,
    });

    const tokens = this.generateTokens(user._id.toString(), user.role);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user, tokens };
  }

  async login(dto: LoginDTO): Promise<AuthResult> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens(user._id.toString(), user.role);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    await userRepository.updateLastLogin(user._id.toString());

    return { user, tokens };
  }

  async googleAuth(idToken: string): Promise<AuthResult> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw AppError.unauthorized('Invalid Google token', 'GOOGLE_AUTH_FAILED');
    }

    let user = await userRepository.findByGoogleId(payload.sub);

    if (!user) {
      user = await userRepository.findByEmail(payload.email);
      if (user) {
        await userRepository.setGoogleId(user._id.toString(), payload.sub);
        user = await userRepository.findById(user._id.toString()) as IUser;
      } else {
        user = await userRepository.create({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email.toLowerCase(),
          googleId: payload.sub,
          avatarUrl: payload.picture,
          isEmailVerified: true,
        });
      }
    }

    if (!user.isActive) {
      throw AppError.forbidden('This account has been deactivated');
    }

    const tokens = this.generateTokens(user._id.toString(), user.role);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    await userRepository.updateLastLogin(user._id.toString());

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await userRepository.findByIdWithTokens(payload.userId);

    if (!user || !user.refreshTokens?.includes(refreshToken)) {
      throw AppError.unauthorized('Invalid refresh token', 'REFRESH_TOKEN_REUSE');
    }

    await userRepository.removeRefreshToken(payload.userId, refreshToken);
    const tokens = this.generateTokens(payload.userId, user.role);
    await userRepository.addRefreshToken(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await userRepository.removeRefreshToken(userId, refreshToken);
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  private generateTokens(userId: string, role: string): AuthTokens {
    return {
      accessToken: signAccessToken(userId, role),
      refreshToken: signRefreshToken(userId, role),
    };
  }
}

export const authService = new AuthService();
