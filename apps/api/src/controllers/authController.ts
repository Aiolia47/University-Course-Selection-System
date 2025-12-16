import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { DatabaseService } from '../services/databaseService';
import { User, UserRole, UserStatus, AuditLog, AuditAction } from '../models';
import { RegisterDto } from '../validators/user.validator';
import { UserProfile } from '../models/UserProfile';
import bcrypt from 'bcryptjs';

export class AuthController {
  private userService: UserService;
  private databaseService: DatabaseService;

  constructor() {
    this.userService = new UserService();
    this.databaseService = DatabaseService.getInstance();
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