import { Repository, Not, DataSource } from 'typeorm';
import { Course, CourseStatus, CourseSchedule, CoursePrerequisite, DayOfWeek } from '../models';
import { DatabaseService } from './databaseService';
import { CreateCourseDto, UpdateCourseDto, QueryCoursesDto, CourseScheduleDto, CourseQueryDto, CourseWithRelations } from '../types/course';

export class CourseService {
  private courseRepository: Repository<Course>;
  private scheduleRepository: Repository<CourseSchedule>;
  private prerequisiteRepository: Repository<CoursePrerequisite>;
  private databaseService: DatabaseService;
  private dataSource: DataSource;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.dataSource = this.databaseService.getDataSource();
    this.courseRepository = this.dataSource.getRepository(Course);
    this.scheduleRepository = this.dataSource.getRepository(CourseSchedule);
    this.prerequisiteRepository = this.dataSource.getRepository(CoursePrerequisite);
  }

  public async create(courseData: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseRepository.findOne({
      where: { code: courseData.code }
    });

    if (existingCourse) {
      throw new Error('课程代码已存在');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Create course
      const course = manager.create(Course, {
        code: courseData.code,
        name: courseData.name,
        description: courseData.description,
        credits: courseData.credits,
        teacher: courseData.teacher,
        capacity: courseData.capacity,
        enrolled: 0
      });

      const savedCourse = await manager.save(course);

      // Create schedules if provided
      if (courseData.schedules && courseData.schedules.length > 0) {
        for (const scheduleData of courseData.schedules) {
          for (const dayOfWeek of scheduleData.dayOfWeek) {
            const schedule = manager.create(CourseSchedule, {
              courseId: savedCourse.id,
              dayOfWeek,
              startTime: scheduleData.startTime,
              endTime: scheduleData.endTime,
              location: scheduleData.location,
              weeks: scheduleData.weeks
            });
            await manager.save(schedule);
          }
        }
      }

      // Create prerequisites if provided
      if (courseData.prerequisites && courseData.prerequisites.length > 0) {
        for (const prereqCode of courseData.prerequisites) {
          const prerequisiteCourse = await manager.findOne(Course, {
            where: { code: prereqCode }
          });

          if (prerequisiteCourse) {
            const prerequisite = manager.create(CoursePrerequisite, {
              courseId: savedCourse.id,
              prerequisiteCourseId: prerequisiteCourse.id
            });
            await manager.save(prerequisite);
          }
        }
      }

      return savedCourse;
    });
  }

  public async findById(id: string): Promise<CourseWithRelations | null> {
    return await this.courseRepository.findOne({
      where: { id },
      relations: ['selections', 'schedules', 'prerequisites', 'prerequisites.prerequisiteCourse']
    });
  }

  public async findByCode(code: string): Promise<Course | null> {
    return await this.courseRepository.findOne({
      where: { code }
    });
  }

  public async findAll(query: QueryCoursesDto = {}): Promise<{
    courses: Course[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course');

    if (query.search) {
      queryBuilder.andWhere(
        '(course.code LIKE :search OR course.name LIKE :search OR course.description LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.teacher) {
      queryBuilder.andWhere('course.teacher LIKE :teacher', {
        teacher: `%${query.teacher}%`
      });
    }

    if (query.status) {
      queryBuilder.andWhere('course.status = :status', { status: query.status });
    } else {
      // By default, only show published courses
      queryBuilder.andWhere('course.status = :status', { status: CourseStatus.PUBLISHED });
    }

    if (query.minCredits !== undefined) {
      queryBuilder.andWhere('course.credits >= :minCredits', { minCredits: query.minCredits });
    }

    if (query.maxCredits !== undefined) {
      queryBuilder.andWhere('course.credits <= :maxCredits', { maxCredits: query.maxCredits });
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('course.createdAt', 'DESC');
    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    const [courses, total] = await queryBuilder.getManyAndCount();

    return {
      courses,
      total,
      page,
      limit
    };
  }

  public async update(id: string, updateData: UpdateCourseDto): Promise<CourseWithRelations | null> {
    const course = await this.findById(id);
    if (!course) {
      throw new Error('课程不存在');
    }

    if (updateData.code && updateData.code !== course.code) {
      const existingCourse = await this.findByCode(updateData.code);
      if (existingCourse && existingCourse.id !== id) {
        throw new Error('课程代码已存在');
      }
    }

    if (updateData.capacity !== undefined && updateData.capacity < course.enrolled) {
      throw new Error('容量不能小于已选课人数');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update course basic info
      if (updateData.name || updateData.description || updateData.credits ||
          updateData.teacher || updateData.capacity || updateData.status) {
        Object.assign(course, {
          name: updateData.name,
          description: updateData.description,
          credits: updateData.credits,
          teacher: updateData.teacher,
          capacity: updateData.capacity,
          status: updateData.status
        });
        await manager.save(course);
      }

      // Update schedules if provided
      if (updateData.schedules !== undefined) {
        // Delete existing schedules
        await manager.delete(CourseSchedule, { courseId: id });

        // Create new schedules
        if (updateData.schedules.length > 0) {
          for (const scheduleData of updateData.schedules) {
            for (const dayOfWeek of scheduleData.dayOfWeek) {
              const schedule = manager.create(CourseSchedule, {
                courseId: id,
                dayOfWeek,
                startTime: scheduleData.startTime,
                endTime: scheduleData.endTime,
                location: scheduleData.location,
                weeks: scheduleData.weeks
              });
              await manager.save(schedule);
            }
          }
        }
      }

      // Update prerequisites if provided
      if (updateData.prerequisites !== undefined) {
        // Delete existing prerequisites
        await manager.delete(CoursePrerequisite, { courseId: id });

        // Create new prerequisites
        if (updateData.prerequisites.length > 0) {
          for (const prereqCode of updateData.prerequisites) {
            const prerequisiteCourse = await manager.findOne(Course, {
              where: { code: prereqCode }
            });

            if (prerequisiteCourse) {
              const prerequisite = manager.create(CoursePrerequisite, {
                courseId: id,
                prerequisiteCourseId: prerequisiteCourse.id
              });
              await manager.save(prerequisite);
            }
          }
        }
      }

      // Return updated course with relations
      return await this.findById(id);
    });
  }

  public async delete(id: string): Promise<void> {
    const course = await this.findById(id);
    if (!course) {
      throw new Error('课程不存在');
    }

    if (course.enrolled > 0) {
      throw new Error('已有人选课，无法删除');
    }

    await this.dataSource.transaction(async (manager) => {
      // Delete schedules and prerequisites first (cascading will handle this, but being explicit)
      await manager.delete(CourseSchedule, { courseId: id });
      await manager.delete(CoursePrerequisite, { courseId: id });

      // Delete the course
      await manager.delete(Course, { id });
    });
  }

  public async increaseEnrolled(courseId: string): Promise<void> {
    await this.courseRepository.increment({ id: courseId }, 'enrolled', 1);
  }

  public async decreaseEnrolled(courseId: string): Promise<void> {
    await this.courseRepository.decrement({ id: courseId }, 'enrolled', 1);
  }

  public async getAvailableCourses(studentId?: string): Promise<Course[]> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course');

    queryBuilder.where('course.status = :status', { status: CourseStatus.PUBLISHED });
    queryBuilder.andWhere('course.enrolled < course.capacity');

    // If studentId is provided, exclude courses the student has already selected
    if (studentId) {
      queryBuilder.andWhere(
        `course.id NOT IN (SELECT selections.course_id FROM selections WHERE selections.user_id = :studentId AND selections.status IN (:...statuses))`,
        {
          studentId,
          statuses: ['pending', 'confirmed', 'completed']
        }
      );
    }

    return await queryBuilder.getMany();
  }

  public async getPopularCourses(limit: number = 5): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { status: CourseStatus.PUBLISHED },
      order: { enrolled: 'DESC' },
      take: limit
    });
  }

  public async getCoursesByTeacher(teacherName: string): Promise<Course[]> {
    return await this.courseRepository.find({
      where: {
        teacher: teacherName,
        status: Not(CourseStatus.CANCELLED)
      },
      order: { createdAt: 'DESC' }
    });
  }

  public async count(filters: {
    status?: CourseStatus;
    teacher?: string;
  } = {}): Promise<number> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course');

    if (filters.status) {
      queryBuilder.andWhere('course.status = :status', { status: filters.status });
    }

    if (filters.teacher) {
      queryBuilder.andWhere('course.teacher = :teacher', { teacher: filters.teacher });
    }

    return await queryBuilder.getCount();
  }

  public async updateEnrollmentNumbers(): Promise<void> {
    const courses = await this.courseRepository.find();

    for (const course of courses) {
      const enrolledCount = await this.courseRepository.query(
        'SELECT COUNT(*) as count FROM selections WHERE course_id = ? AND status IN (?, ?)',
        [course.id, 'confirmed', 'completed']
      );

      course.enrolled = enrolledCount[0].count;
      await this.courseRepository.save(course);
    }
  }

  // New methods for enhanced course management
  public async getCoursesWithRelations(query: CourseQueryDto = {}): Promise<{
    courses: CourseWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.courseRepository.createQueryBuilder('course')
      .leftJoinAndSelect('course.schedules', 'schedule')
      .leftJoinAndSelect('course.prerequisites', 'prerequisite')
      .leftJoinAndSelect('prerequisite.prerequisiteCourse', 'prereqCourse');

    if (query.search) {
      queryBuilder.andWhere(
        '(course.code LIKE :search OR course.name LIKE :search OR course.description LIKE :search OR course.teacher LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.teacher) {
      queryBuilder.andWhere('course.teacher LIKE :teacher', {
        teacher: `%${query.teacher}%`
      });
    }

    if (query.status) {
      queryBuilder.andWhere('course.status = :status', { status: query.status });
    }

    if (query.credits) {
      queryBuilder.andWhere('course.credits = :credits', { credits: query.credits });
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;

    // Add sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`course.${sortBy}`, sortOrder);

    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    const [courses, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      courses,
      total,
      page,
      limit,
      totalPages
    };
  }

  public async batchCreate(coursesData: CreateCourseDto[]): Promise<Course[]> {
    const createdCourses: Course[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < coursesData.length; i++) {
      try {
        const course = await this.create(coursesData[i]);
        createdCourses.push(course);
      } catch (error) {
        errors.push({ index: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    if (errors.length > 0 && createdCourses.length === 0) {
      throw new Error(`批量创建失败: ${errors.map(e => e.error).join(', ')}`);
    }

    return createdCourses;
  }

  public async batchUpdate(updates: Array<{ id: string; data: UpdateCourseDto }>): Promise<Course[]> {
    const updatedCourses: Course[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < updates.length; i++) {
      try {
        const course = await this.update(updates[i].id, updates[i].data);
        if (course) {
          updatedCourses.push(course);
        }
      } catch (error) {
        errors.push({ index: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    if (errors.length > 0 && updatedCourses.length === 0) {
      throw new Error(`批量更新失败: ${errors.map(e => e.error).join(', ')}`);
    }

    return updatedCourses;
  }

  public async batchDelete(ids: string[]): Promise<void> {
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.delete(id);
      } catch (error) {
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    if (errors.length > 0) {
      throw new Error(`批量删除部分失败: ${errors.map(e => `${e.id}: ${e.error}`).join(', ')}`);
    }
  }
}