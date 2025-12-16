import request from 'supertest';
import { app } from '../../src/app';
import { DatabaseService } from '../../src/services/databaseService';
import { User, UserRole, UserStatus } from '../../src/models';
import bcrypt from 'bcryptjs';

describe('AuthController', () => {
  let databaseService: DatabaseService;
  let dataSource: any;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    dataSource = databaseService.getDataSource();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.createQueryBuilder()
      .delete()
      .from(User)
      .execute();
  });

  afterAll(async () => {
    // Close database connection
    if (dataSource) {
      await dataSource.destroy();
    }
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      studentId: '2024001',
      username: 'john_doe',
      email: 'john.doe@university.edu',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    describe('Success cases', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/v1/auth/register')
          .send(validUserData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('注册成功');
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.studentId).toBe(validUserData.studentId);
        expect(response.body.data.user.username).toBe(validUserData.username);
        expect(response.body.data.user.email).toBe(validUserData.email);
        expect(response.body.data.user.role).toBe(UserRole.STUDENT);
        expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);
        expect(response.body.data.user.passwordHash).toBeUndefined();
        expect(response.body.data.user.profile).toBeDefined();
        expect(response.body.data.user.profile.firstName).toBe(validUserData.firstName);
      });

      it('should register a user without lastName', async () => {
        const userDataWithoutLastName = {
          ...validUserData,
          lastName: undefined
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(userDataWithoutLastName)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.profile.lastName).toBeNull();
      });

      it('should hash the password before storing', async () => {
        await request(app)
          .post('/v1/auth/register')
          .send(validUserData)
          .expect(201);

        // Retrieve the user from database
        const user = await dataSource.getRepository(User)
          .findOne({ where: { email: validUserData.email } });

        expect(user).toBeDefined();
        expect(user!.passwordHash).not.toBe(validUserData.password);

        // Verify password is correctly hashed
        const isPasswordValid = await bcrypt.compare(validUserData.password, user!.passwordHash);
        expect(isPasswordValid).toBe(true);
      });
    });

    describe('Validation errors', () => {
      it('should return validation error for missing required fields', async () => {
        const incompleteData = {
          username: 'john_doe',
          email: 'john.doe@university.edu'
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(incompleteData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should return validation error for invalid student ID format', async () => {
        const invalidStudentId = {
          ...validUserData,
          studentId: 'ab' // Too short
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(invalidStudentId)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should return validation error for invalid email format', async () => {
        const invalidEmail = {
          ...validUserData,
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(invalidEmail)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should return validation error for weak password', async () => {
        const weakPassword = {
          ...validUserData,
          password: '123' // Too weak
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(weakPassword)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('Uniqueness validation', () => {
      beforeEach(async () => {
        // Create a test user
        const userRepository = dataSource.getRepository(User);
        const passwordHash = await bcrypt.hash(validUserData.password, 10);

        await userRepository.save({
          studentId: validUserData.studentId,
          username: validUserData.username,
          email: validUserData.email,
          passwordHash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE
        });
      });

      it('should return error for duplicate student ID', async () => {
        const duplicateStudentId = {
          ...validUserData,
          username: 'different_username',
          email: 'different.email@university.edu'
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(duplicateStudentId)
          .expect(409);

        expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
        expect(response.body.error.details).toBe('学号已存在');
      });

      it('should return error for duplicate username', async () => {
        const duplicateUsername = {
          ...validUserData,
          studentId: '2024999',
          email: 'different.email@university.edu'
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(duplicateUsername)
          .expect(409);

        expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
        expect(response.body.error.details).toBe('用户名已存在');
      });

      it('should return error for duplicate email', async () => {
        const duplicateEmail = {
          ...validUserData,
          studentId: '2024999',
          username: 'different_username'
        };

        const response = await request(app)
          .post('/v1/auth/register')
          .send(duplicateEmail)
          .expect(409);

        expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
        expect(response.body.error.details).toBe('邮箱已存在');
      });
    });

    describe('Rate limiting', () => {
      it('should handle rapid registration attempts', async () => {
        const uniqueUserData = [
          { ...validUserData, studentId: '2024001', username: 'user1', email: 'user1@test.com' },
          { ...validUserData, studentId: '2024002', username: 'user2', email: 'user2@test.com' },
          { ...validUserData, studentId: '2024003', username: 'user3', email: 'user3@test.com' }
        ];

        // First request should succeed
        const firstResponse = await request(app)
          .post('/v1/auth/register')
          .send(uniqueUserData[0]);
        expect(firstResponse.status).toBe(201);

        // Second unique request should also succeed (within rate limit)
        const secondResponse = await request(app)
          .post('/v1/auth/register')
          .send(uniqueUserData[1]);
        expect([201, 409]).toContain(secondResponse.status);

        // Test the rate limiter is applied by checking response headers
        expect(firstResponse.headers['x-ratelimit-limit']).toBeDefined();
        expect(firstResponse.headers['x-ratelimit-remaining']).toBeDefined();
        expect(firstResponse.headers['x-ratelimit-reset']).toBeDefined();
      });
    });
  });
});