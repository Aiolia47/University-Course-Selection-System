import request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../../src/app';
import { Course, User, UserRole, UserStatus, Permission, RolePermission } from '../../src/models';
import { JwtService } from '../../src/services/jwtService';
import { initializeTestDatabase, closeTestDatabase, clearTestDatabase } from '../testDatabase';

describe('Courses API Integration Tests', () => {
  let dataSource: DataSource;
  let authToken: string;
  let adminToken: string;
  let jwtService: JwtService;

  beforeAll(async () => {
    dataSource = await initializeTestDatabase();
    jwtService = new JwtService();

    // Create permissions
    const permissionRepository = dataSource.getRepository(Permission);
    await permissionRepository.save([
      { name: 'course.read', resource: 'course', action: 'read', description: '查看课程' },
      { name: 'course.manage', resource: 'course', action: 'manage', description: '管理课程' }
    ]);

    // Create test user
    const userRepository = dataSource.getRepository(User);
    const testUser = await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE
    });

    // Create admin user
    const adminUser = await userRepository.save({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    });

    // Assign permissions to admin
    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const permissions = await permissionRepository.find();
    for (const permission of permissions) {
      await rolePermissionRepository.save({
        role: UserRole.ADMIN,
        permissionId: permission.id
      });
    }

    // Generate tokens
    authToken = jwtService.generateToken({
      id: testUser.id,
      username: testUser.username,
      role: testUser.role
    });

    adminToken = jwtService.generateToken({
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/v1/courses', () => {
    it('should create a new course with valid data and admin permissions', async () => {
      const courseData = {
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学的基础概念',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: 'published'
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('CS101');
      expect(response.body.data.name).toBe('计算机科学导论');
      expect(response.body.data.credits).toBe(3);
      expect(response.body.data.enrolled).toBe(0);
    });

    it('should create a course with schedules and prerequisites', async () => {
      // Create prerequisite course first
      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS100',
          name: '编程基础',
          credits: 2,
          teacher: '王教授',
          capacity: 30
        });

      const courseData = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        schedules: [{
          dayOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
          startTime: '09:00',
          endTime: '10:30',
          location: '教学楼A101',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        }],
        prerequisites: ['CS100']
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.data.schedules).toHaveLength(3);
      expect(response.body.data.prerequisites).toContain('CS100');
    });

    it('should reject course creation without authentication', async () => {
      const courseData = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      await request(app)
        .post('/api/v1/courses')
        .send(courseData)
        .expect(401);
    });

    it('should reject course creation without manage permissions', async () => {
      const courseData = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(courseData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '计算机科学导论'
        // Missing required fields: code, credits, teacher, capacity
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/courses', () => {
    beforeEach(async () => {
      // Create test courses
      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30,
          status: 'published'
        });

      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS201',
          name: '数据结构与算法',
          credits: 4,
          teacher: '李教授',
          capacity: 25,
          status: 'published'
        });
    });

    it('should get paginated courses', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter courses by search term', async () => {
      const response = await request(app)
        .get('/api/v1/courses?search=计算机')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.courses).toHaveLength(1);
      expect(response.body.data.courses[0].name).toContain('计算机');
    });

    it('should filter courses by teacher', async () => {
      const response = await request(app)
        .get('/api/v1/courses?teacher=张')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.courses).toHaveLength(1);
      expect(response.body.data.courses[0].teacher).toContain('张');
    });

    it('should sort courses by specified field', async () => {
      const response = await request(app)
        .get('/api/v1/courses?sortBy=code&sortOrder=ASC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.courses[0].code).toBe('CS101');
      expect(response.body.data.courses[1].code).toBe('CS201');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/courses')
        .expect(401);
    });
  });

  describe('GET /api/v1/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30,
          schedules: [{
            dayOfWeek: [1, 3],
            startTime: '09:00',
            endTime: '10:30',
            location: 'A101',
            weeks: [1, 2, 3, 4, 5, 6, 7, 8]
          }]
        });

      courseId = response.body.data.id;
    });

    it('should get course by id with relations', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(courseId);
      expect(response.body.data.code).toBe('CS101');
      expect(response.body.data.schedules).toHaveLength(2);
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/v1/courses/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('COURSE_NOT_FOUND');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30
        });

      courseId = response.body.data.id;
    });

    it('should update course with valid data', async () => {
      const updateData = {
        name: '计算机科学导论（更新）',
        description: '更新后的课程描述',
        capacity: 35
      };

      const response = await request(app)
        .put(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('计算机科学导论（更新）');
      expect(response.body.data.capacity).toBe(35);
    });

    it('should reject update without manage permissions', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      await request(app)
        .put(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent course', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/v1/courses/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error.code).toBe('COURSE_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/courses/:id', () => {
    let courseId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30
        });

      courseId = response.body.data.id;
    });

    it('should delete course', async () => {
      const response = await request(app)
        .delete(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // Verify course is deleted
      await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject delete without manage permissions', async () => {
      await request(app)
        .delete(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/courses/batch', () => {
    it('should batch create courses', async () => {
      const batchData = {
        operation: 'create',
        courses: [
          {
            code: 'CS101',
            name: '计算机科学导论',
            credits: 3,
            teacher: '张教授',
            capacity: 30
          },
          {
            code: 'CS201',
            name: '数据结构与算法',
            credits: 4,
            teacher: '李教授',
            capacity: 25
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/courses/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toHaveLength(2);
    });

    it('should batch update courses', async () => {
      // Create courses first
      const course1 = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30
        });

      const course2 = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS201',
          name: '数据结构与算法',
          credits: 4,
          teacher: '李教授',
          capacity: 25
        });

      const batchData = {
        operation: 'update',
        courses: [
          {
            id: course1.body.data.id,
            name: '计算机科学导论（更新）',
            capacity: 35
          },
          {
            id: course2.body.data.id,
            name: '数据结构与算法（更新）',
            capacity: 30
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/courses/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toHaveLength(2);
    });

    it('should batch delete courses', async () => {
      // Create courses first
      const course1 = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30
        });

      const course2 = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS201',
          name: '数据结构与算法',
          credits: 4,
          teacher: '李教授',
          capacity: 25
        });

      const batchData = {
        operation: 'delete',
        courseIds: [course1.body.data.id, course2.body.data.id]
      };

      const response = await request(app)
        .post('/api/v1/courses/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toHaveLength(2);
    });
  });

  describe('GET /api/v1/courses/stats', () => {
    beforeEach(async () => {
      // Create test courses with different statuses
      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101',
          name: '计算机科学导论',
          credits: 3,
          teacher: '张教授',
          capacity: 30,
          status: 'published'
        });

      await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS102',
          name: '计算机科学导论2',
          credits: 3,
          teacher: '张教授',
          capacity: 30,
          status: 'draft'
        });
    });

    it('should get course statistics', async () => {
      const response = await request(app)
        .get('/api/v1/courses/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.publishedCourses).toBe(1);
      expect(response.body.data.draftCourses).toBe(1);
      expect(response.body.data.totalCourses).toBe(1);
    });

    it('should get statistics filtered by teacher', async () => {
      const response = await request(app)
        .get('/api/v1/courses/stats?teacher=张')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teacherCourses).toBe(2);
    });
  });
});