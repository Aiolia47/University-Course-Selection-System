import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { AuditLog, AuditAction } from '../models';
import { DatabaseService } from '../services/databaseService';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCoursesDto,
  BatchCourseOperationDto
} from '../validators/course.validator';
import { Course, CourseStatus } from '../models';

export class CourseController {
  private courseService: CourseService;
  private databaseService: DatabaseService;

  constructor() {
    this.courseService = new CourseService();
    this.databaseService = DatabaseService.getInstance();
  }

  private async logAudit(
    userId: string,
    action: AuditAction,
    description: string,
    details?: any
  ): Promise<void> {
    try {
      const auditRepository = this.databaseService.getDataSource().getRepository(AuditLog);
      await auditRepository.save({
        userId,
        action,
        description,
        details: JSON.stringify(details),
        ipAddress: details?.ip || '',
        userAgent: details?.userAgent || ''
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  private transformCourseToResponse(course: any): any {
    if (!course) return null;

    const response = {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      teacher: course.teacher,
      capacity: course.capacity,
      enrolled: course.enrolled,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    // Add schedules if available
    if (course.schedules && course.schedules.length > 0) {
      (response as any).schedules = course.schedules.map((schedule: any) => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.location,
        weeks: schedule.weeks
      }));
    }

    // Add prerequisites if available
    if (course.prerequisites && course.prerequisites.length > 0) {
      (response as any).prerequisites = course.prerequisites.map((prereq: any) =>
        prereq.prerequisiteCourse ? prereq.prerequisiteCourse.code : null
      ).filter(Boolean);
    }

    return response;
  }

  public createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseData: CreateCourseDto = req.body;
      const user = (req as any).user;

      const course = await this.courseService.create(courseData);

      await this.logAudit(
        user.id,
        AuditAction.CREATE,
        '创建课程',
        {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      );

      res.status(201).json({
        success: true,
        message: '课程创建成功',
        data: this.transformCourseToResponse(course)
      });
    } catch (error) {
      next(error);
    }
  };

  public getCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: QueryCoursesDto = req.query;
      const user = (req as any).user;

      // Use basic findAll for simple queries, or enhanced version when relations are needed
      if (query.search || query.teacher || query.status || query.credits) {
        const result = await this.courseService.getCoursesWithRelations(query);

        res.json({
          success: true,
          data: {
            courses: result.courses.map(course => this.transformCourseToResponse(course)),
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
              hasNext: result.page < result.totalPages,
              hasPrev: result.page > 1
            }
          }
        });
      } else {
        // Use existing findAll method for backward compatibility
        const result = await this.courseService.findAll(query);

        res.json({
          success: true,
          data: {
            courses: result.courses.map(course => this.transformCourseToResponse(course)),
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: Math.ceil(result.total / result.limit),
              hasNext: result.page < Math.ceil(result.total / result.limit),
              hasPrev: result.page > 1
            }
          }
        });
      }
    } catch (error) {
      next(error);
    }
  };

  public getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const course = await this.courseService.findById(id);

      if (!course) {
        res.status(404).json({
          error: {
            code: 'COURSE_NOT_FOUND',
            message: '课程不存在'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: this.transformCourseToResponse(course)
      });
    } catch (error) {
      next(error);
    }
  };

  public updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateCourseDto = req.body;
      const user = (req as any).user;

      const course = await this.courseService.update(id, updateData);

      if (!course) {
        res.status(404).json({
          error: {
            code: 'COURSE_NOT_FOUND',
            message: '课程不存在'
          }
        });
        return;
      }

      await this.logAudit(
        user.id,
        AuditAction.UPDATE,
        '更新课程',
        {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          updateFields: Object.keys(updateData),
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      );

      res.json({
        success: true,
        message: '课程更新成功',
        data: this.transformCourseToResponse(course)
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // First get the course details for audit log
      const course = await this.courseService.findById(id);

      if (!course) {
        res.status(404).json({
          error: {
            code: 'COURSE_NOT_FOUND',
            message: '课程不存在'
          }
        });
        return;
      }

      await this.courseService.delete(id);

      await this.logAudit(
        user.id,
        AuditAction.DELETE,
        '删除课程',
        {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      );

      res.json({
        success: true,
        message: '课程删除成功'
      });
    } catch (error) {
      next(error);
    }
  };

  public batchOperations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batchData: BatchCourseOperationDto = req.body;
      const user = (req as any).user;

      let result: any = {};

      switch (batchData.operation) {
        case 'create':
          if (!batchData.courses || batchData.courses.length === 0) {
            res.status(400).json({
              error: {
                code: 'INVALID_INPUT',
                message: '批量创建需要提供课程数据'
              }
            });
            return;
          }
          result.created = await this.courseService.batchCreate(batchData.courses);
          break;

        case 'update':
          if (!batchData.courses || batchData.courses.length === 0) {
            res.status(400).json({
              error: {
                code: 'INVALID_INPUT',
                message: '批量更新需要提供课程数据'
              }
            });
            return;
          }
          const updates = batchData.courses.map(course => ({
            id: course.id!,
            data: course
          }));
          result.updated = await this.courseService.batchUpdate(updates);
          break;

        case 'delete':
          if (!batchData.courseIds || batchData.courseIds.length === 0) {
            res.status(400).json({
              error: {
                code: 'INVALID_INPUT',
                message: '批量删除需要提供课程ID列表'
              }
            });
            return;
          }
          await this.courseService.batchDelete(batchData.courseIds);
          result.deleted = batchData.courseIds;
          break;

        default:
          res.status(400).json({
            error: {
              code: 'INVALID_OPERATION',
              message: '不支持的批量操作类型'
            }
          });
          return;
      }

      await this.logAudit(
        user.id,
        AuditAction.UPDATE,
        `批量${batchData.operation}课程`,
        {
          operation: batchData.operation,
          count: batchData.courses?.length || batchData.courseIds?.length || 0,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      );

      res.json({
        success: true,
        message: `批量${batchData.operation}操作完成`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  public getCourseStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teacher } = req.query;

      const totalCourses = await this.courseService.count({
        status: CourseStatus.PUBLISHED
      });

      const draftCourses = await this.courseService.count({
        status: CourseStatus.DRAFT
      });

      const cancelledCourses = await this.courseService.count({
        status: CourseStatus.CANCELLED
      });

      const completedCourses = await this.courseService.count({
        status: CourseStatus.COMPLETED
      });

      let teacherCourses = 0;
      if (teacher) {
        teacherCourses = await this.courseService.count({
          teacher: teacher as string
        });
      }

      res.json({
        success: true,
        data: {
          totalCourses,
          draftCourses,
          publishedCourses: totalCourses,
          cancelledCourses,
          completedCourses,
          teacherCourses
        }
      });
    } catch (error) {
      next(error);
    }
  };
}