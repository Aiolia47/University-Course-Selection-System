import { Repository, Not } from 'typeorm';
import { Course, CourseStatus } from '../models/Course';
import { DatabaseService } from './databaseService';
import { CreateCourseDto, UpdateCourseDto, QueryCoursesDto } from '../validators/course.validator';

export class CourseService {
  private courseRepository: Repository<Course>;
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    const dataSource = this.databaseService.getDataSource();
    this.courseRepository = dataSource.getRepository(Course);
  }

  public async create(courseData: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseRepository.findOne({
      where: { code: courseData.code }
    });

    if (existingCourse) {
      throw new Error('课程代码已存在');
    }

    const course = this.courseRepository.create({
      ...courseData,
      enrolled: 0
    });

    return await this.courseRepository.save(course);
  }

  public async findById(id: string): Promise<Course | null> {
    return await this.courseRepository.findOne({
      where: { id },
      relations: ['selections']
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

  public async update(id: string, updateData: UpdateCourseDto): Promise<Course | null> {
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

    Object.assign(course, updateData);
    return await this.courseRepository.save(course);
  }

  public async delete(id: string): Promise<void> {
    const course = await this.findById(id);
    if (!course) {
      throw new Error('课程不存在');
    }

    if (course.enrolled > 0) {
      throw new Error('已有人选课，无法删除');
    }

    await this.courseRepository.remove(course);
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
}