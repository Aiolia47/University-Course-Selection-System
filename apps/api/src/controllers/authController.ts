import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { DatabaseService } from '../services/databaseService';
import { JwtService } from '../services/jwtService';
import { LoginAttemptService } from '../services/loginAttemptService';
import { User, UserRole, UserStatus, AuditLog, AuditAction } from '../models';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../validators/user.validator';
import { UserProfile } from '../models/UserProfile';
import bcrypt from 'bcryptjs';

export class AuthController {
  private userService: UserService;
  private databaseService: DatabaseService;
  private jwtService: JwtService;
  private loginAttemptService: LoginAttemptService;

  constructor() {
    this.userService = new UserService();
    this.databaseService = DatabaseService.getInstance();
    this.jwtService = new JwtService();
    this.loginAttemptService = new LoginAttemptService();
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerData: RegisterDto = req.body;

      // Check if user already exists
      const existingUser = await this.checkUserExists(
        registerData.studentId,
        registerData.username,
        registerData.email
      );

      if (existingUser) {
        res.status(409).json({
          error: {
            code: 'DUPLICATE_ENTRY',
            message: '用户已存在',
            details: existingUser
          }
        });
        return;
      }

      // Create user with profile
      const user = await this.createUserWithProfile(registerData);

      // Log audit
      await this.logAudit(user.id, AuditAction.USER_REGISTER, '用户注册', {
        studentId: registerData.studentId,
        username: registerData.username,
        email: registerData.email,
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.connection.remoteAddress
      });

      // Return user data without password
      const { passwordHash, ...userWithoutPassword } = user;

      // Load user profile
      const profileRepository = this.databaseService.getDataSource().getRepository(UserProfile);
      const profile = await profileRepository.findOne({
        where: { userId: user.id }
      });

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            ...userWithoutPassword,
            profile
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const identifier = loginData.username.toLowerCase(); // Normalize identifier
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      // Check if identifier is locked
      const lockStatus = this.loginAttemptService.isLocked(identifier);
      if (lockStatus.isLocked) {
        await this.logAudit('', AuditAction.USER_LOGIN_FAILED, '账户已锁定', {
          identifier,
          ip: ipAddress,
          userAgent,
          reason: 'Too many failed attempts'
        });

        res.status(423).json({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: '账户已被锁定，请稍后再试',
            details: {
              remainingTime: lockStatus.remainingTime,
              unit: 'seconds'
            }
          }
        });
        return;
      }

      // Find user by username, email, or studentId
      let user: User | null = null;
      const loginIdentifier = loginData.username.toLowerCase().trim();

      // Try to find by username
      user = await this.userService.findByUsername(loginIdentifier);

      // If not found, try by email
      if (!user) {
        user = await this.userService.findByEmail(loginIdentifier);
      }

      // If not found, try by studentId (exact match, no case transformation)
      if (!user) {
        user = await this.userService.findByStudentId(loginData.username.trim());
      }

      if (!user) {
        // Record failed attempt for security (even if user doesn't exist)
        this.loginAttemptService.recordFailedAttempt(identifier);

        await this.logAudit('', AuditAction.USER_LOGIN_FAILED, '用户不存在', {
          identifier,
          ip: ipAddress,
          userAgent
        });

        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
            details: {
              remainingAttempts: this.loginAttemptService.getRemainingAttempts(identifier)
            }
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

        await this.logAudit(user.id, AuditAction.USER_LOGIN_FAILED, reason, {
          identifier,
          ip: ipAddress,
          userAgent,
          userStatus: user.status
        });

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

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        // Record failed attempt
        const attemptRecord = this.loginAttemptService.recordFailedAttempt(identifier);

        await this.logAudit(user.id, AuditAction.USER_LOGIN_FAILED, '密码错误', {
          identifier,
          ip: ipAddress,
          userAgent,
          attempts: attemptRecord.attempts,
          maxAttempts: 5
        });

        // Check if account should be locked after this attempt
        if (attemptRecord.isLocked) {
          res.status(423).json({
            error: {
              code: 'ACCOUNT_LOCKED',
              message: '登录失败次数过多，账户已被锁定30分钟',
              details: {
                remainingTime: lockStatus.remainingTime || 1800,
                unit: 'seconds'
              }
            }
          });
          return;
        }

        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
            details: {
              remainingAttempts: this.loginAttemptService.getRemainingAttempts(identifier)
            }
          }
        });
        return;
      }

      // Clear failed attempts on successful login
      this.loginAttemptService.clearAttempts(identifier);

      // Load user profile
      const profileRepository = this.databaseService.getDataSource().getRepository(UserProfile);
      const profile = await profileRepository.findOne({
        where: { userId: user.id }
      });

      // Generate JWT tokens
      const tokens = this.jwtService.generateTokenPair(user);

      // Log successful login
      await this.logAudit(user.id, AuditAction.USER_LOGIN, '用户登录成功', {
        identifier,
        ip: ipAddress,
        userAgent,
        rememberMe: loginData.rememberMe || false
      });

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      // Set HTTP-only cookie for refresh token if remember me is enabled
      if (loginData.rememberMe) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: this.jwtService.getRefreshTokenExpirationTime()
        });
      }

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            ...userWithoutPassword,
            profile
          },
          accessToken: tokens.accessToken,
          refreshToken: loginData.rememberMe ? undefined : tokens.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshData: RefreshTokenDto = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      // Check refresh token in cookie first
      let refreshToken = refreshData.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: '缺少刷新令牌'
          }
        });
        return;
      }

      // Verify refresh token
      let tokenData: { userId: string; type: string };
      try {
        tokenData = this.jwtService.verifyRefreshToken(refreshToken);
      } catch (error) {
        await this.logAudit('', AuditAction.USER_LOGIN_FAILED, '无效的刷新令牌', {
          error: error.message,
          ip: ipAddress,
          userAgent
        });

        res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: '无效的刷新令牌'
          }
        });
        return;
      }

      // Verify token type
      if (tokenData.type !== 'refresh') {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: '令牌类型错误'
          }
        });
        return;
      }

      // Find user
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
        res.status(403).json({
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: '账户未激活'
          }
        });
        return;
      }

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair(user);

      // Load user profile
      const profileRepository = this.databaseService.getDataSource().getRepository(UserProfile);
      const profile = await profileRepository.findOne({
        where: { userId: user.id }
      });

      // Set new refresh token cookie
      if (req.cookies?.refreshToken) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: this.jwtService.getRefreshTokenExpirationTime()
        });
      }

      res.status(200).json({
        success: true,
        message: '令牌刷新成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: req.cookies?.refreshToken ? undefined : tokens.refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      const authHeader = req.headers.authorization;

      // Get user ID from token if available
      let userId = '';
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const tokenData = this.jwtService.verifyAccessToken(token);
          userId = tokenData.userId;
        } catch (error) {
          // Token is invalid but we still clear cookies
          console.warn('Invalid token during logout:', error.message);
        }
      }

      // Log logout
      if (userId) {
        await this.logAudit(userId, AuditAction.USER_LOGOUT, '用户登出', {
          ip: ipAddress,
          userAgent
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      next(error);
    }
  };

  public getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: '未认证'
          }
        });
        return;
      }

      // Load user profile
      const profileRepository = this.databaseService.getDataSource().getRepository(UserProfile);
      const profile = await profileRepository.findOne({
        where: { userId: user.id }
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...user,
            profile
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  private async checkUserExists(studentId: string, username: string, email: string): Promise<string | null> {
    try {
      // Check student ID
      const existingByStudentId = await this.userService.findByStudentId(studentId);
      if (existingByStudentId) {
        return '学号已存在';
      }

      // Check username
      const existingByUsername = await this.userService.findByUsername(username);
      if (existingByUsername) {
        return '用户名已存在';
      }

      // Check email
      const existingByEmail = await this.userService.findByEmail(email);
      if (existingByEmail) {
        return '邮箱已存在';
      }

      return null;
    } catch (error) {
      throw new Error(`检查用户唯一性时发生错误: ${error.message}`);
    }
  }

  private async createUserWithProfile(registerData: RegisterDto) {
    const dataSource = this.databaseService.getDataSource();
    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(UserProfile);

    return await dataSource.transaction(async manager => {
      // Hash password
      const passwordHash = await bcrypt.hash(registerData.password, 10);

      // Create user
      const user = await manager.save(User, {
        studentId: registerData.studentId,
        username: registerData.username,
        email: registerData.email,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      // Create user profile
      const profile = await manager.save(UserProfile, {
        firstName: registerData.firstName,
        lastName: registerData.lastName || null,
        userId: user.id
      });

      // Attach profile to user
      user.profile = profile;

      return user;
    });
  }

  private async logAudit(userId: string, action: AuditAction, description: string, details: any) {
    try {
      const auditRepository = this.databaseService.getDataSource().getRepository(AuditLog);
      await auditRepository.save({
        userId,
        action,
        description,
        details: JSON.stringify(details),
        ipAddress: details.ip || null,
        userAgent: details.userAgent || null
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      console.error('Failed to log audit:', error);
    }
  }
}