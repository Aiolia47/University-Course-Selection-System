import { User, UserRole, UserStatus } from '../../src/models/User';
import { DataSource } from 'typeorm';
import { initializeTestDatabase, closeTestDatabase, clearTestDatabase } from '../testDatabase';

describe('User Model', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await initializeTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('User Entity', () => {
    it('should create a user with required fields', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      const savedUser = await userRepository.save(user);

      expect(savedUser.id).toBeDefined();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.role).toBe(UserRole.STUDENT);
      expect(savedUser.status).toBe(UserStatus.ACTIVE);
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with optional studentId', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: 'student001',
        email: 'student001@example.com',
        passwordHash: 'hashedpassword123',
        studentId: '2021001',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      const savedUser = await userRepository.save(user);

      expect(savedUser.studentId).toBe('2021001');
    });

    it('should create an admin user', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      });

      const savedUser = await userRepository.save(user);

      expect(savedUser.role).toBe(UserRole.ADMIN);
    });

    it('should enforce unique username', async () => {
      const userRepository = dataSource.getRepository(User);

      const user1 = userRepository.create({
        username: 'duplicate',
        email: 'user1@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      const user2 = userRepository.create({
        username: 'duplicate',
        email: 'user2@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      await userRepository.save(user1);

      await expect(userRepository.save(user2)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userRepository = dataSource.getRepository(User);

      const user1 = userRepository.create({
        username: 'user1',
        email: 'duplicate@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      const user2 = userRepository.create({
        username: 'user2',
        email: 'duplicate@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      await userRepository.save(user1);

      await expect(userRepository.save(user2)).rejects.toThrow();
    });

    it('should enforce unique studentId when provided', async () => {
      const userRepository = dataSource.getRepository(User);

      const user1 = userRepository.create({
        username: 'student001',
        email: 'student1@example.com',
        passwordHash: 'hashedpassword123',
        studentId: '2021001',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      const user2 = userRepository.create({
        username: 'student002',
        email: 'student2@example.com',
        passwordHash: 'hashedpassword123',
        studentId: '2021001',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      await userRepository.save(user1);

      await expect(userRepository.save(user2)).rejects.toThrow();
    });

    it('should allow multiple users with null studentId', async () => {
      const userRepository = dataSource.getRepository(User);

      const user1 = userRepository.create({
        username: 'user1',
        email: 'user1@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      });

      const user2 = userRepository.create({
        username: 'user2',
        email: 'user2@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      });

      const savedUser1 = await userRepository.save(user1);
      const savedUser2 = await userRepository.save(user2);

      expect(savedUser1.studentId).toBeNull();
      expect(savedUser2.studentId).toBeNull();
    });
  });

  describe('User Validation', () => {
    it('should validate username length', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: '', // Empty username
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: 'testuser',
        email: 'invalid-email', // Invalid email
        passwordHash: 'hashedpassword123',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'invalid_role' as any, // Invalid role
        status: UserStatus.ACTIVE
      });

      await expect(userRepository.save(user)).rejects.toThrow();
    });
  });
});