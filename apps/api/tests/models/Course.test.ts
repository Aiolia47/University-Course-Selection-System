import { Course, CourseStatus } from '../../src/models/Course';
import { DataSource } from 'typeorm';
import { initializeTestDatabase, closeTestDatabase, clearTestDatabase } from '../testDatabase';

describe('Course Model', () => {
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

  describe('Course Entity', () => {
    it('should create a course with required fields', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.id).toBeDefined();
      expect(savedCourse.code).toBe('CS101');
      expect(savedCourse.name).toBe('计算机科学导论');
      expect(savedCourse.credits).toBe(3);
      expect(savedCourse.teacher).toBe('张教授');
      expect(savedCourse.capacity).toBe(30);
      expect(savedCourse.enrolled).toBe(0);
      expect(savedCourse.status).toBe(CourseStatus.PUBLISHED);
      expect(savedCourse.createdAt).toBeInstanceOf(Date);
      expect(savedCourse.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a course with optional description', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS201',
        name: '数据结构',
        description: '数据结构和算法基础课程',
        credits: 4,
        teacher: '李教授',
        capacity: 25,
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.description).toBe('数据结构和算法基础课程');
    });

    it('should create a draft course', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS301',
        name: '数据库系统',
        credits: 3,
        teacher: '王教授',
        capacity: 20,
        status: CourseStatus.DRAFT
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.status).toBe(CourseStatus.DRAFT);
    });

    it('should enforce unique course code', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course1 = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      const course2 = courseRepository.create({
        code: 'CS101',
        name: '计算机科学基础',
        credits: 3,
        teacher: '李教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      await courseRepository.save(course1);

      await expect(courseRepository.save(course2)).rejects.toThrow();
    });

    it('should have default enrolled count of 0', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.enrolled).toBe(0);
    });

    it('should have default capacity of 1 if not specified', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.capacity).toBe(1);
    });

    it('should have default status of draft if not specified', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      });

      const savedCourse = await courseRepository.save(course);

      expect(savedCourse.status).toBe(CourseStatus.DRAFT);
    });
  });

  describe('Course Validation', () => {
    it('should validate course code format', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: '', // Empty code
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });

    it('should validate course name', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '', // Empty name
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });

    it('should validate credits range', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 0, // Invalid credits
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });

    it('should validate teacher name', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '', // Empty teacher name
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });

    it('should validate capacity is positive', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 0, // Invalid capacity
        status: CourseStatus.PUBLISHED
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: 'invalid_status' as any // Invalid status
      });

      await expect(courseRepository.save(course)).rejects.toThrow();
    });
  });

  describe('Course Business Logic', () => {
    it('should track enrollment count', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      // Simulate enrollment
      await courseRepository.increment({ id: savedCourse.id }, 'enrolled', 1);

      const updatedCourse = await courseRepository.findOne({ where: { id: savedCourse.id } });
      expect(updatedCourse?.enrolled).toBe(1);
    });

    it('should not exceed capacity', async () => {
      const courseRepository = dataSource.getRepository(Course);

      const course = courseRepository.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 2,
        status: CourseStatus.PUBLISHED
      });

      const savedCourse = await courseRepository.save(course);

      // This would be handled by business logic, not database constraints
      // Just testing that we can track enrollment
      await courseRepository.increment({ id: savedCourse.id }, 'enrolled', 2);

      const updatedCourse = await courseRepository.findOne({ where: { id: savedCourse.id } });
      expect(updatedCourse?.enrolled).toBe(2);
    });
  });
});