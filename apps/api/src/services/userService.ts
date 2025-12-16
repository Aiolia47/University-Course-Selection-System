import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../models/User';
import { DatabaseService } from './databaseService';
import bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../validators/user.validator';
import { UserProfile } from '../models/UserProfile';

export class UserService {
  private userRepository: Repository<User>;
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    const dataSource = this.databaseService.getDataSource();
    this.userRepository = dataSource.getRepository(User);
  }

  public async create(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: userData.username },
        { email: userData.email },
        ...(userData.studentId ? [{ studentId: userData.studentId }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.username === userData.username) {
        throw new Error('用户名已存在');
      }
      if (existingUser.email === userData.email) {
        throw new Error('邮箱已存在');
      }
      if (userData.studentId && existingUser.studentId === userData.studentId) {
        throw new Error('学号已存在');
      }
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      ...userData,
      passwordHash,
      studentId: userData.studentId || null
    });

    return await this.userRepository.save(user);
  }

  public async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id }
    });
  }

  public async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username }
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email }
    });
  }

  public async findByStudentId(studentId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { studentId }
    });
  }

  public async findAll(filters: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.studentId LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('user.createdAt', 'DESC');
    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      total,
      page,
      limit
    };
  }

  public async update(id: string, updateData: UpdateUserDto): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.findByUsername(updateData.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error('用户名已存在');
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('邮箱已存在');
      }
    }

    if (updateData.studentId && updateData.studentId !== user.studentId) {
      const existingUser = await this.findByStudentId(updateData.studentId);
      if (existingUser && existingUser.id !== id) {
        throw new Error('学号已存在');
      }
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  public async changePassword(id: string, passwordData: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('当前密码错误');
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error('新密码和确认密码不匹配');
    }

    const newPasswordHash = await bcrypt.hash(passwordData.newPassword, 10);
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);
  }

  public async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    await this.userRepository.remove(user);
  }

  public async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
  }

  public async count(filters: {
    role?: UserRole;
    status?: UserStatus;
  } = {}): Promise<number> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    return await queryBuilder.getCount();
  }
}