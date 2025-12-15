import { Repository, Between } from 'typeorm';
import { Selection, SelectionStatus } from '../models/Selection';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { DatabaseService } from './databaseService';
import { CreateSelectionDto, UpdateSelectionDto, QuerySelectionsDto } from '../validators/selection.validator';

export class SelectionService {
  private selectionRepository: Repository<Selection>;
  private userRepository: Repository<User>;
  private courseRepository: Repository<Course>;
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    const dataSource = this.databaseService.getDataSource();
    this.selectionRepository = dataSource.getRepository(Selection);
    this.userRepository = dataSource.getRepository(User);
    this.courseRepository = dataSource.getRepository(Course);
  }

  public async create(selectionData: CreateSelectionDto): Promise<Selection> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: selectionData.userId }
    });
    if (!user) {
      throw new Error('用户不存在');
    }

    // Check if course exists
    const course = await this.courseRepository.findOne({
      where: { id: selectionData.courseId }
    });
    if (!course) {
      throw new Error('课程不存在');
    }

    // Check if course is published
    if (course.status !== 'published') {
      throw new Error('课程未发布，无法选课');
    }

    // Check if user has already selected this course
    const existingSelection = await this.selectionRepository.findOne({
      where: {
        userId: selectionData.userId,
        courseId: selectionData.courseId
      }
    });
    if (existingSelection) {
      throw new Error('您已经选择了这门课程');
    }

    // Check if course has capacity
    if (course.enrolled >= course.capacity) {
      throw new Error('课程已满，无法选课');
    }

    const selection = this.selectionRepository.create({
      ...selectionData,
      status: SelectionStatus.PENDING,
      selectedAt: new Date()
    });

    const savedSelection = await this.selectionRepository.save(selection);

    // Update course enrollment
    await this.courseRepository.increment(
      { id: selectionData.courseId },
      'enrolled',
      1
    );

    return savedSelection;
  }

  public async findById(id: string): Promise<Selection | null> {
    return await this.selectionRepository.findOne({
      where: { id },
      relations: ['user', 'course']
    });
  }

  public async findByUser(userId: string, status?: SelectionStatus): Promise<Selection[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.selectionRepository.find({
      where,
      relations: ['course']
    });
  }

  public async findByCourse(courseId: string, status?: SelectionStatus): Promise<Selection[]> {
    const where: any = { courseId };
    if (status) {
      where.status = status;
    }

    return await this.selectionRepository.find({
      where,
      relations: ['user']
    });
  }

  public async findAll(query: QuerySelectionsDto = {}): Promise<{
    selections: Selection[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.selectionRepository.createQueryBuilder('selection')
      .leftJoinAndSelect('selection.user', 'user')
      .leftJoinAndSelect('selection.course', 'course');

    if (query.userId) {
      queryBuilder.andWhere('selection.userId = :userId', { userId: query.userId });
    }

    if (query.courseId) {
      queryBuilder.andWhere('selection.courseId = :courseId', { courseId: query.courseId });
    }

    if (query.status) {
      queryBuilder.andWhere('selection.status = :status', { status: query.status });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('selection.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate + ' 23:59:59')
      });
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('selection.createdAt', 'DESC');
    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    const [selections, total] = await queryBuilder.getManyAndCount();

    return {
      selections,
      total,
      page,
      limit
    };
  }

  public async update(id: string, updateData: UpdateSelectionDto): Promise<Selection | null> {
    const selection = await this.findById(id);
    if (!selection) {
      throw new Error('选课记录不存在');
    }

    // Handle status transitions
    if (updateData.status) {
      if (selection.status === SelectionStatus.CONFIRMED &&
          updateData.status === SelectionStatus.PENDING) {
        throw new Error('已确认的选课不能改为待确认状态');
      }

      if (selection.status === SelectionStatus.COMPLETED) {
        throw new Error('已完成的选课不能修改状态');
      }

      // If cancelling a confirmed selection, decrease enrollment
      if (selection.status === SelectionStatus.CONFIRMED &&
          updateData.status === SelectionStatus.CANCELLED) {
        await this.courseRepository.decrement(
          { id: selection.courseId },
          'enrolled',
          1
        );
        updateData.cancelledAt = new Date();
      }

      // If confirming a selection
      if (selection.status === SelectionStatus.PENDING &&
          updateData.status === SelectionStatus.CONFIRMED) {
        updateData.confirmedAt = new Date();
      }
    }

    Object.assign(selection, updateData);
    return await this.selectionRepository.save(selection);
  }

  public async confirmSelection(id: string, notes?: string): Promise<Selection | null> {
    const selection = await this.findById(id);
    if (!selection) {
      throw new Error('选课记录不存在');
    }

    if (selection.status !== SelectionStatus.PENDING) {
      throw new Error('只能确认待确认的选课记录');
    }

    selection.status = SelectionStatus.CONFIRMED;
    selection.confirmedAt = new Date();
    if (notes) {
      selection.notes = notes;
    }

    return await this.selectionRepository.save(selection);
  }

  public async cancelSelection(id: string, reason: string): Promise<Selection | null> {
    const selection = await this.findById(id);
    if (!selection) {
      throw new Error('选课记录不存在');
    }

    if (selection.status === SelectionStatus.COMPLETED) {
      throw new Error('已完成的选课不能取消');
    }

    if (selection.status === SelectionStatus.CANCELLED) {
      throw new Error('选课记录已取消');
    }

    const previousStatus = selection.status;
    selection.status = SelectionStatus.CANCELLED;
    selection.cancelledAt = new Date();
    selection.notes = reason;

    const savedSelection = await this.selectionRepository.save(selection);

    // If it was a confirmed selection, decrease enrollment
    if (previousStatus === SelectionStatus.CONFIRMED) {
      await this.courseRepository.decrement(
        { id: selection.courseId },
        'enrolled',
        1
      );
    }

    return savedSelection;
  }

  public async delete(id: string): Promise<void> {
    const selection = await this.findById(id);
    if (!selection) {
      throw new Error('选课记录不存在');
    }

    if (selection.status === SelectionStatus.CONFIRMED) {
      throw new Error('已确认的选课不能删除');
    }

    await this.selectionRepository.remove(selection);
  }

  public async getUserSelectionStats(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    totalCredits: number;
  }> {
    const selections = await this.findByUser(userId);

    const stats = {
      total: selections.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      totalCredits: 0
    };

    for (const selection of selections) {
      stats[selection.status]++;
      if (selection.status === SelectionStatus.CONFIRMED || selection.status === SelectionStatus.COMPLETED) {
        stats.totalCredits += selection.course.credits;
      }
    }

    return stats;
  }

  public async getCourseSelectionStats(courseId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    completionRate: number;
  }> {
    const selections = await this.findByCourse(courseId);

    const stats = {
      total: selections.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      completionRate: 0
    };

    for (const selection of selections) {
      stats[selection.status]++;
    }

    const totalActive = stats.confirmed + stats.completed;
    stats.completionRate = totalActive > 0 ? (stats.completed / totalActive) * 100 : 0;

    return stats;
  }

  public async count(filters: {
    userId?: string;
    courseId?: string;
    status?: SelectionStatus;
  } = {}): Promise<number> {
    const queryBuilder = this.selectionRepository.createQueryBuilder('selection');

    if (filters.userId) {
      queryBuilder.andWhere('selection.userId = :userId', { userId: filters.userId });
    }

    if (filters.courseId) {
      queryBuilder.andWhere('selection.courseId = :courseId', { courseId: filters.courseId });
    }

    if (filters.status) {
      queryBuilder.andWhere('selection.status = :status', { status: filters.status });
    }

    return await queryBuilder.getCount();
  }
}