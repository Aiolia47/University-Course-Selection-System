export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface CourseSchedule {
  dayOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  location: string;
  weeks: number[];
}

export interface CoursePrerequisite {
  courseId: string;
  courseCode: string;
  courseName: string;
  minimumGrade?: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  teacher: string;
  capacity: number;
  enrolled: number;
  status: CourseStatus;
  schedules: CourseSchedule[];
  prerequisites: CoursePrerequisite[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseFilters {
  search?: string;
  teacher?: string;
  status?: CourseStatus;
  minCredits?: number;
  maxCredits?: number;
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CourseQueryParams extends CourseFilters {
  page?: number;
  limit?: number;
  sortBy?: keyof Course;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CourseCardProps {
  course: Course;
  onSelect?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
  onFavorite?: (courseId: string) => void;
  isFavorite?: boolean;
  compareMode?: boolean;
  onCompare?: (courseId: string) => void;
  isInCompareList?: boolean;
}

export interface CourseListState {
  list: Course[];
  current: Course | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: CourseFilters;
  favorites: string[];
  compareList: string[];
}