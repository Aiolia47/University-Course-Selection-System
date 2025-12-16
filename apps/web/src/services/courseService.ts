import { apiService } from './api';
import {
  Course,
  CourseFilters,
  PaginatedResponse,
  CourseQueryParams,
  CreateCourseRequest,
  UpdateCourseRequest,
  BatchOperationRequest,
  ImportResult,
  OperationHistory,
  OperationHistoryQuery
} from '@/types/course';

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
   * Get course by ID with caching
   */
  async getCourseById(courseId: string): Promise<Course> {
    // Check cache first
    const cachedCourse = await this.getCachedCourseById(courseId);
    if (cachedCourse) {
      return cachedCourse;
    }

    const response = await apiService.get(`/courses/${courseId}`);
    const course = response.data;

    // Cache the course
    await this.cacheCourseById(courseId, course);

    return course;
  }

  /**
   * Cache a specific course by ID
   */
  async cacheCourseById(courseId: string, course: Course): Promise<void> {
    if ('indexedDB' in window) {
      const request = indexedDB.open('CourseDetailCacheDB', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('courseDetails')) {
          const store = db.createObjectStore('courseDetails', { keyPath: 'id' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['courseDetails'], 'readwrite');
        const store = transaction.objectStore('courseDetails');

        // Add cache timestamp
        const courseWithTimestamp = {
          ...course,
          cachedAt: Date.now()
        };

        store.put(courseWithTimestamp);
      };
    }
  }

  /**
   * Get cached course by ID
   */
  async getCachedCourseById(courseId: string): Promise<Course | null> {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }

      const request = indexedDB.open('CourseDetailCacheDB', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['courseDetails'], 'readonly');
        const store = transaction.objectStore('courseDetails');
        const getRequest = store.get(courseId);

        getRequest.onsuccess = () => {
          const cachedData = getRequest.result;
          if (cachedData) {
            // Check if cache is still valid (5 minutes)
            const cacheValidTime = 5 * 60 * 1000; // 5 minutes
            if (Date.now() - cachedData.cachedAt < cacheValidTime) {
              // Remove cache timestamp before returning
              const { cachedAt, ...course } = cachedData;
              resolve(course);
              return;
            }
          }
          resolve(null);
        };

        getRequest.onerror = () => {
          resolve(null);
        };
      };

      request.onerror = () => {
        resolve(null);
      };
    });
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

  /**
   * Clear outdated course detail cache
   */
  async clearOutdatedCache(): Promise<void> {
    if (!('indexedDB' in window)) {
      return;
    }

    const request = indexedDB.open('CourseDetailCacheDB', 1);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['courseDetails'], 'readwrite');
      const store = transaction.objectStore('courseDetails');
      const index = store.index('cachedAt');

      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes

      // Get all entries older than maxAge
      const range = IDBKeyRange.upperBound(now - maxAge);
      const getRequest = index.getAll(range);

      getRequest.onsuccess = () => {
        const outdatedEntries = getRequest.result;
        outdatedEntries.forEach((entry: any) => {
          store.delete(entry.id);
        });
      };
    };
  }

  /**
   * Refresh course data (bypass cache)
   */
  async refreshCourse(courseId: string): Promise<Course> {
    const response = await apiService.get(`/courses/${courseId}`);
    const course = response.data;

    // Update cache with fresh data
    await this.cacheCourseById(courseId, course);

    return course;
  }

  // ========== ADMIN METHODS ==========

  /**
   * Create a new course (Admin only)
   */
  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    const response = await apiService.post('/courses', courseData);
    return response.data;
  }

  /**
   * Update an existing course (Admin only)
   */
  async updateCourse(courseId: string, courseData: UpdateCourseRequest): Promise<Course> {
    const response = await apiService.put(`/courses/${courseId}`, courseData);
    return response.data;
  }

  /**
   * Delete a course (Admin only)
   */
  async deleteCourse(courseId: string): Promise<void> {
    await apiService.delete(`/courses/${courseId}`);
  }

  /**
   * Perform batch operations on courses (Admin only)
   */
  async batchOperation(request: BatchOperationRequest): Promise<any> {
    const response = await apiService.post('/courses/batch', request);
    return response.data;
  }

  /**
   * Import courses from file (Admin only)
   */
  async importCourses(formData: FormData): Promise<ImportResult> {
    const response = await apiService.post('/courses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Download import template (Admin only)
   */
  async downloadTemplate(format: 'csv' | 'excel'): Promise<Blob> {
    const client = apiService.getClient();
    const response = await client.get(`/courses/template/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get operation history for a course (Admin only)
   */
  async getOperationHistory(
    courseId: string,
    query: OperationHistoryQuery = {}
  ): Promise<PaginatedResponse<OperationHistory>> {
    const queryParams = new URLSearchParams();

    if (query.page) queryParams.append('page', query.page.toString());
    if (query.limit) queryParams.append('limit', query.limit.toString());
    if (query.search) queryParams.append('search', query.search);
    if (query.operation) queryParams.append('operation', query.operation);
    if (query.status) queryParams.append('status', query.status);
    if (query.startDate) queryParams.append('startDate', query.startDate);
    if (query.endDate) queryParams.append('endDate', query.endDate);

    const url = `/courses/${courseId}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get(url);

    return response.data as PaginatedResponse<OperationHistory>;
  }

  /**
   * Revert a specific operation (Admin only)
   */
  async revertOperation(operationId: string): Promise<Course> {
    const response = await apiService.post(`/courses/operations/${operationId}/revert`);
    return response.data;
  }

  /**
   * Get course statistics for admin dashboard
   */
  async getAdminStatistics(): Promise<any> {
    const response = await apiService.get('/courses/admin/statistics');
    return response.data;
  }

  /**
   * Export selected courses (Admin only)
   */
  async exportSelectedCourses(courseIds: string[], format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const client = apiService.getClient();
    const response = await client.post(`/courses/export/selected`, {
      courseIds,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Validate course data before import (Admin only)
   */
  async validateImportData(formData: FormData): Promise<any> {
    const response = await apiService.post('/courses/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

// Create singleton instance
export const courseService = new CourseService();
export default courseService;