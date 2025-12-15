// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  credits: number;
  teacher: string;
  semester: string;
  capacity: number;
  enrolled: number;
  schedule: CourseSchedule;
  prerequisites?: string[];
}

export interface CourseSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

// Selection types
export interface CourseSelection {
  id: string;
  userId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  selectedAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Form types
export interface CourseFilters {
  search?: string;
  semester?: string;
  teacher?: string;
  dayOfWeek?: string;
  hasPrerequisites?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// App configuration
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'test';
  version: string;
  title: string;
}