import { Course, CourseSchedule, CoursePrerequisite, CourseStatus, DayOfWeek } from '../models';

export interface CourseScheduleDto {
  dayOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  location: string;
  weeks: number[];
}

export interface CreateCourseDto {
  code: string;
  name: string;
  description?: string;
  credits: number;
  teacher: string;
  capacity: number;
  schedules?: CourseScheduleDto[];
  prerequisites?: string[];
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  credits?: number;
  teacher?: string;
  capacity?: number;
  status?: CourseStatus;
  schedules?: CourseScheduleDto[];
  prerequisites?: string[];
}

export interface CourseQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  teacher?: string;
  status?: CourseStatus;
  credits?: number;
  sortBy?: 'code' | 'name' | 'teacher' | 'credits' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CourseResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  teacher: string;
  capacity: number;
  enrolled: number;
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
  schedules?: CourseScheduleDto[];
  prerequisites?: string[];
}

export interface PaginatedCourseResponseDto {
  data: CourseResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BatchCourseOperationDto {
  operation: 'create' | 'update' | 'delete';
  courses?: (CreateCourseDto & { id?: string })[];
  courseIds?: string[];
}

export interface BatchCourseResultDto {
  success: boolean;
  message: string;
  data?: {
    created?: CourseResponseDto[];
    updated?: CourseResponseDto[];
    deleted?: string[];
    failed?: Array<{
      index: number;
      data: any;
      error: string;
    }>;
  };
}

// Internal service types
export interface CourseWithRelations extends Course {
  schedules?: CourseSchedule[];
  prerequisites?: CoursePrerequisite[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}