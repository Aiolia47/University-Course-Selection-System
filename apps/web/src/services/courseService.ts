import { apiService } from './api';
import { Course, CourseFilters, PaginatedResponse, CourseQueryParams } from '@/types/course';

export class CourseService {
  /**
   * Get paginated list of courses with optional filters
   */
  async getCourses(params: CourseQueryParams = {}): Promise<PaginatedResponse<Course>> {
    const queryParams = new URLSearchParams();

    // Add pagination
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    // Add filters
    if (params.search) queryParams.append('search', params.search);
    if (params.teacher) queryParams.append('teacher', params.teacher);
    if (params.status) queryParams.append('status', params.status);
    if (params.minCredits) queryParams.append('minCredits', params.minCredits.toString());
    if (params.maxCredits) queryParams.append('maxCredits', params.maxCredits.toString());
    if (params.dayOfWeek) queryParams.append('dayOfWeek', params.dayOfWeek);
    if (params.location) queryParams.append('location', params.location);

    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get(url);

    return response.data as PaginatedResponse<Course>;
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course> {
    const response = await apiService.get(`/courses/${courseId}`);
    return response.data;
  }

  /**
   * Search courses with full-text search
   */
  async searchCourses(query: string, params: CourseQueryParams = {}): Promise<PaginatedResponse<Course>> {
    const queryParams = new URLSearchParams({
      search: query,
      ...params
    } as any);

    const response = await apiService.get(`/courses/search?${queryParams}`);
    return response.data as PaginatedResponse<Course>;
  }

  /**
   * Get popular/recommended courses
   */
  async getPopularCourses(limit = 10): Promise<PaginatedResponse<Course>> {
    const response = await apiService.get(`/courses/popular?limit=${limit}`);
    return response.data as PaginatedResponse<Course>;
  }

  /**
   * Get courses by teacher
   */
  async getCoursesByTeacher(teacherName: string, page = 1, limit = 20): Promise<PaginatedResponse<Course>> {
    const response = await apiService.get(`/courses/teacher/${encodeURIComponent(teacherName)}?page=${page}&limit=${limit}`);
    return response.data as PaginatedResponse<Course>;
  }

  /**
   * Get available time slots for course scheduling
   */
  async getAvailableTimeSlots(): Promise<any[]> {
    const response = await apiService.get('/courses/available-slots');
    return response.data;
  }

  /**
   * Get course enrollment statistics
   */
  async getCourseStatistics(courseId: string): Promise<any> {
    const response = await apiService.get(`/courses/${courseId}/statistics`);
    return response.data;
  }

  /**
   * Check course prerequisites for a student
   */
  async checkPrerequisites(courseId: string, studentId: string): Promise<any> {
    const response = await apiService.get(`/courses/${courseId}/prerequisites/check?studentId=${studentId}`);
    return response.data;
  }

  /**
   * Get courses that a student is eligible to enroll in
   */
  async getEligibleCourses(studentId: string, filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const queryParams = new URLSearchParams({
      studentId,
      ...filters
    } as any);

    const response = await apiService.get(`/courses/eligible?${queryParams}`);
    return response.data as PaginatedResponse<Course>;
  }

  /**
   * Bulk get courses by IDs
   */
  async getCoursesByIds(courseIds: string[]): Promise<Course[]> {
    const response = await apiService.post('/courses/bulk', { courseIds });
    return response.data;
  }

  /**
   * Export courses to different formats
   */
  async exportCourses(format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: CourseFilters): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format,
      ...filters
    } as any);

    const client = apiService.getClient();
    const response = await client.get(`/courses/export?${queryParams}`, {
      responseType: 'blob'
    });

    return response.data;
  }

  /**
   * Get course recommendations for a student
   */
  async getRecommendations(studentId: string, limit = 5): Promise<Course[]> {
    const response = await apiService.get(`/courses/recommendations?studentId=${studentId}&limit=${limit}`);
    return response.data;
  }

  /**
   * Track course views for analytics
   */
  async trackCourseView(courseId: string): Promise<void> {
    await apiService.post(`/courses/${courseId}/view`);
  }

  /**
   * Cache course data for offline access
   */
  async cacheCourses(courses: Course[]): Promise<void> {
    // Store in IndexedDB for offline access
    if ('indexedDB' in window) {
      const request = indexedDB.open('CourseCacheDB', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('courses')) {
          db.createObjectStore('courses', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['courses'], 'readwrite');
        const store = transaction.objectStore('courses');

        courses.forEach(course => {
          store.put(course);
        });
      };
    }
  }

  /**
   * Get cached courses
   */
  async getCachedCourses(): Promise<Course[] | null> {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }

      const request = indexedDB.open('CourseCacheDB', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['courses'], 'readonly');
        const store = transaction.objectStore('courses');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };

        getAllRequest.onerror = () => {
          resolve(null);
        };
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }
}

// Create singleton instance
export const courseService = new CourseService();
export default courseService;