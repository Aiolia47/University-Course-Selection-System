import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwtService';
import { UserService } from '../services/userService';
import { User, UserRole, UserStatus } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface TokenData {
  userId: string;
  studentId?: string;
  username: string;
  email: string;
  role: UserRole;
}

export class AuthMiddleware {
  private jwtService: JwtService;
  private userService: UserService;

  constructor() {
    this.jwtService = new JwtService();
    this.userService = new UserService();
  }

  /**
   * Main authentication middleware
   * Verifies JWT token and attaches user to request
   */
  public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from header
      const token = this.jwtService.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: '缺少认证令牌'
          }
        });
        return;
      }

      // Verify token
      let tokenData: TokenData;
      try {
        tokenData = this.jwtService.verifyAccessToken(token);
      } catch (error) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: '无效的认证令牌',
            details: error.message
          }
        });
        return;
      }

      // Find user in database
      const user = await this.userService.findById(tokenData.userId);
      if (!user) {
        res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
        return;
      }

      // Check if user account is active
      if (user.status !== UserStatus.ACTIVE) {
        let reason = '';
        switch (user.status) {
          case UserStatus.INACTIVE:
            reason = '账户未激活';
            break;
          case UserStatus.SUSPENDED:
            reason = '账户已被暂停';
            break;
          default:
            reason = '账户状态异常';
        }

        res.status(403).json({
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: reason,
            details: {
              status: user.status
            }
          }
        });
        return;
      }

      // Attach user to request (remove password hash for security)
      const { passwordHash, ...userWithoutPassword } = user;
      req.user = userWithoutPassword as User;

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Role-based authorization middleware
   * Requires specific user roles to access the resource
   */
  public authorize = (allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: '未认证'
          }
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足',
            details: {
              required: allowedRoles,
              current: user.role
            }
          }
        });
        return;
      }

      next();
    };
  };

  /**
   * Admin-only authorization middleware
   */
  public requireAdmin = this.authorize([UserRole.ADMIN]);

  /**
   * Student or admin authorization middleware
   */
  public requireStudentOrAdmin = this.authorize([UserRole.STUDENT, UserRole.ADMIN]);

  /**
   * Optional authentication middleware
   * Attaches user to request if token is valid, but doesn't fail if no token
   */
  public optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.jwtService.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        // No token provided, continue without authentication
        next();
        return;
      }

      try {
        const tokenData = this.jwtService.verifyAccessToken(token);
        const user = await this.userService.findById(tokenData.userId);

        if (user && user.status === UserStatus.ACTIVE) {
          const { passwordHash, ...userWithoutPassword } = user;
          req.user = userWithoutPassword as User;
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
        console.warn('Optional authentication failed:', error.message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Export singleton instance for convenience
export const authMiddleware = new AuthMiddleware();
export const authenticate = authMiddleware.authenticate;
export const authorize = authMiddleware.authorize;
export const requireAdmin = authMiddleware.requireAdmin;
export const requireStudentOrAdmin = authMiddleware.requireStudentOrAdmin;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;