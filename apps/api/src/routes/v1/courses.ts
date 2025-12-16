import { Router } from 'express';
import { CourseController } from '../../controllers/courseController';
import { validateDto } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { rateLimiterMiddleware } from '../../middleware/rateLimiter.middleware';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCoursesDto,
  BatchCourseOperationDto
} from '../../validators/course.validator';
import { CourseService } from '../../services/courseService';

export const coursesRouter = Router();
const courseController = new CourseController();
const courseService = new CourseService();

// Helper function to get course for permission checks
async function getCourse(req: any): Promise<any> {
  const { id } = req.params;
  return await courseService.findById(id);
}

// All course routes require authentication
coursesRouter.use(authenticate);

// GET /courses - Get courses with filtering, pagination and search
// Read permission required
coursesRouter.get(
  '/',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 15 minutes, 100 requests
  requirePermission('course', 'read'),
  validateDto(QueryCoursesDto, { query: true }),
  courseController.getCourses
);

// GET /courses/stats - Get course statistics
// Read permission required
coursesRouter.get(
  '/stats',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 15 minutes, 50 requests
  requirePermission('course', 'read'),
  courseController.getCourseStats
);

// POST /courses - Create new course
// Manage permission required
coursesRouter.post(
  '/',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 15 minutes, 50 requests
  requirePermission('course', 'manage'),
  validateDto(CreateCourseDto),
  courseController.createCourse
);

// POST /courses/batch - Batch operations on courses
// Manage permission required
coursesRouter.post(
  '/batch',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 15 minutes, 20 requests
  requirePermission('course', 'manage'),
  validateDto(BatchCourseOperationDto),
  courseController.batchOperations
);

// GET /courses/:id - Get single course by ID
// Read permission required
coursesRouter.get(
  '/:id',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 15 minutes, 100 requests
  requirePermission('course', 'read', getCourse),
  courseController.getCourse
);

// PUT /courses/:id - Update course
// Manage permission required
coursesRouter.put(
  '/:id',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 15 minutes, 50 requests
  requirePermission('course', 'manage', getCourse),
  validateDto(UpdateCourseDto),
  courseController.updateCourse
);

// DELETE /courses/:id - Delete course
// Manage permission required
coursesRouter.delete(
  '/:id',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 30 }), // 15 minutes, 30 requests
  requirePermission('course', 'manage', getCourse),
  courseController.deleteCourse
);