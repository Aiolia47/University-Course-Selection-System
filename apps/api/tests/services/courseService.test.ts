import { CourseService } from '../../src/services/courseService';
import { Course, CourseStatus, DayOfWeek } from '../../src/models';
import { DataSource } from 'typeorm';
import { initializeTestDatabase, closeTestDatabase, clearTestDatabase } from '../testDatabase';
import { CreateCourseDto, UpdateCourseDto } from '../../src/validators/course.validator';

describe('CourseService', () => {
  let dataSource: DataSource;
  let courseService: CourseService;

  beforeAll(async () => {
    dataSource = await initializeTestDatabase();
    courseService = new CourseService();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('create', () => {
    it('should create a course with valid data', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学的基础概念',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      const course = await courseService.create(courseData);

      expect(course.id).toBeDefined();
      expect(course.code).toBe('CS101');
      expect(course.name).toBe('计算机科学导论');
      expect(course.description).toBe('计算机科学的基础概念');
      expect(course.credits).toBe(3);
      expect(course.teacher).toBe('张教授');
      expect(course.capacity).toBe(30);
      expect(course.enrolled).toBe(0);
      expect(course.status).toBe(CourseStatus.DRAFT);
    });

    it('should create a course with schedules and prerequisites', async () => {
      // Create prerequisite course first
      const prereqCourseData: CreateCourseDto = {
        code: 'CS100',
        name: '编程基础',
        credits: 2,
        teacher: '王教授',
        capacity: 30
      };
      await courseService.create(prereqCourseData);

      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学的基础概念',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        schedules: [{
          dayOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
          startTime: '09:00',
          endTime: '10:30',
          location: '教学楼A101',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        }],
        prerequisites: ['CS100']
      };

      const course = await courseService.create(courseData);

      expect(course.code).toBe('CS101');

      // Verify schedules were created
      const courseWithRelations = await courseService.findById(course.id);
      expect(courseWithRelations?.schedules).toHaveLength(3);
      expect(courseWithRelations?.prerequisites).toHaveLength(1);
      expect(courseWithRelations?.prerequisites[0].prerequisiteCourse.code).toBe('CS100');
    });

    it('should throw error when course code already exists', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      await courseService.create(courseData);

      await expect(courseService.create(courseData)).rejects.toThrow('课程代码已存在');
    });
  });

  describe('findById', () => {
    it('should find course by id with relations', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      const createdCourse = await courseService.create(courseData);
      const foundCourse = await courseService.findById(createdCourse.id);

      expect(foundCourse).toBeDefined();
      expect(foundCourse?.id).toBe(createdCourse.id);
      expect(foundCourse?.code).toBe('CS101');
    });

    it('should return null for non-existent course', async () => {
      const foundCourse = await courseService.findById('non-existent-id');
      expect(foundCourse).toBeNull();
    });
  });

  describe('update', () => {
    it('should update course with valid data', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      const course = await courseService.create(courseData);

      const updateData: UpdateCourseDto = {
        name: '计算机科学导论（更新）',
        description: '更新后的课程描述',
        capacity: 35
      };

      const updatedCourse = await courseService.update(course.id, updateData);

      expect(updatedCourse?.name).toBe('计算机科学导论（更新）');
      expect(updatedCourse?.description).toBe('更新后的课程描述');
      expect(updatedCourse?.capacity).toBe(35);
      expect(updatedCourse?.code).toBe('CS101'); // Should remain unchanged
    });

    it('should update course schedules and prerequisites', async () => {
      // Create prerequisite course
      await courseService.create({
        code: 'CS100',
        name: '编程基础',
        credits: 2,
        teacher: '王教授',
        capacity: 30
      });

      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      const course = await courseService.create(courseData);

      const updateData: UpdateCourseDto = {
        schedules: [{
          dayOfWeek: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
          startTime: '14:00',
          endTime: '15:30',
          location: '教学楼B201',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8]
        }],
        prerequisites: ['CS100']
      };

      const updatedCourse = await courseService.update(course.id, updateData);

      expect(updatedCourse?.schedules).toHaveLength(2);
      expect(updatedCourse?.prerequisites).toHaveLength(1);
      expect(updatedCourse?.prerequisites[0].prerequisiteCourse.code).toBe('CS100');
    });

    it('should throw error for non-existent course', async () => {
      const updateData: UpdateCourseDto = {
        name: 'Updated Name'
      };

      await expect(courseService.update('non-existent-id', updateData))
        .rejects.toThrow('课程不存在');
    });
  });

  describe('getCoursesWithRelations', () => {
    beforeEach(async () => {
      // Create test courses
      await courseService.create({
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学基础',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        schedules: [{
          dayOfWeek: [DayOfWeek.MONDAY],
          startTime: '09:00',
          endTime: '10:30',
          location: 'A101',
          weeks: [1, 2, 3]
        }]
      });

      await courseService.create({
        code: 'CS201',
        name: '数据结构与算法',
        credits: 4,
        teacher: '李教授',
        capacity: 25
      });

      await courseService.create({
        code: 'MATH101',
        name: '高等数学',
        credits: 4,
        teacher: '王教授',
        capacity: 50
      });
    });

    it('should return paginated courses with relations', async () => {
      const result = await courseService.getCoursesWithRelations({
        page: 1,
        limit: 2
      });

      expect(result.courses).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter courses by search term', async () => {
      const result = await courseService.getCoursesWithRelations({
        search: '计算机'
      });

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].name).toContain('计算机');
    });

    it('should filter courses by teacher', async () => {
      const result = await courseService.getCoursesWithRelations({
        teacher: '张'
      });

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].teacher).toContain('张');
    });

    it('should filter courses by status', async () => {
      const result = await courseService.getCoursesWithRelations({
        status: CourseStatus.DRAFT
      });

      expect(result.courses).toHaveLength(3); // All courses are created as draft by default
    });

    it('should sort courses by specified field', async () => {
      const result = await courseService.getCoursesWithRelations({
        sortBy: 'code',
        sortOrder: 'ASC'
      });

      expect(result.courses[0].code).toBe('CS101');
      expect(result.courses[1].code).toBe('CS201');
      expect(result.courses[2].code).toBe('MATH101');
    });
  });

  describe('batch operations', () => {
    it('should batch create courses', async () => {
      const coursesData: CreateCourseDto[] = [
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
      ];

      const createdCourses = await courseService.batchCreate(coursesData);

      expect(createdCourses).toHaveLength(2);
      expect(createdCourses[0].code).toBe('CS101');
      expect(createdCourses[1].code).toBe('CS201');
    });

    it('should batch update courses', async () => {
      const course1 = await courseService.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      });

      const course2 = await courseService.create({
        code: 'CS201',
        name: '数据结构与算法',
        credits: 4,
        teacher: '李教授',
        capacity: 25
      });

      const updates = [
        {
          id: course1.id,
          data: { capacity: 35 } as UpdateCourseDto
        },
        {
          id: course2.id,
          data: { capacity: 30 } as UpdateCourseDto
        }
      ];

      const updatedCourses = await courseService.batchUpdate(updates);

      expect(updatedCourses).toHaveLength(2);
      expect(updatedCourses[0].capacity).toBe(35);
      expect(updatedCourses[1].capacity).toBe(30);
    });

    it('should batch delete courses', async () => {
      const course1 = await courseService.create({
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      });

      const course2 = await courseService.create({
        code: 'CS201',
        name: '数据结构与算法',
        credits: 4,
        teacher: '李教授',
        capacity: 25
      });

      await courseService.batchDelete([course1.id, course2.id]);

      const foundCourse1 = await courseService.findById(course1.id);
      const foundCourse2 = await courseService.findById(course2.id);

      expect(foundCourse1).toBeNull();
      expect(foundCourse2).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete course and related data', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        schedules: [{
          dayOfWeek: [DayOfWeek.MONDAY],
          startTime: '09:00',
          endTime: '10:30',
          location: 'A101',
          weeks: [1, 2, 3]
        }]
      };

      const course = await courseService.create(courseData);
      await courseService.delete(course.id);

      const foundCourse = await courseService.findById(course.id);
      expect(foundCourse).toBeNull();
    });

    it('should throw error when trying to delete course with enrolled students', async () => {
      const courseData: CreateCourseDto = {
        code: 'CS101',
        name: '计算机科学导论',
        credits: 3,
        teacher: '张教授',
        capacity: 30
      };

      const course = await courseService.create(courseData);

      // Manually set enrolled count to simulate enrolled students
      const courseRepository = dataSource.getRepository(Course);
      await courseRepository.update(course.id, { enrolled: 5 });

      await expect(courseService.delete(course.id))
        .rejects.toThrow('已有人选课，无法删除');
    });
  });
});