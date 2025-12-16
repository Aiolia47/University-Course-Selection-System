import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models';

export interface TokenPayload {
  userId: string;
  studentId?: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string = '15m';
  private readonly refreshTokenExpiry: string = '7d';

  constructor() {
    // Use environment variables or default values for secrets
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('JWT secrets not configured, using default values. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production.');
    }
  }

  /**
   * Generate both access and refresh tokens for a user
   */
  public generateTokenPair(user: User): TokenPair {
    const payload: TokenPayload = {
      userId: user.id,
      studentId: user.studentId || undefined,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'bmad7-api',
      audience: 'bmad7-web'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'bmad7-api',
        audience: 'bmad7-web'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'bmad7-api',
        audience: 'bmad7-web'
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'bmad7-api',
        audience: 'bmad7-web'
      }) as { userId: string; type: string };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  public getAccessTokenExpirationTime(): number {
    return 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get refresh token expiration time in milliseconds
   */
  public getRefreshTokenExpirationTime(): number {
    return 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Extract token from Bearer header
   */
  public extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}