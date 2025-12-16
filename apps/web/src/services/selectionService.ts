import { apiService } from './api';
import { Course } from '@/types/course';

export enum SelectionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface Selection {
  id: string;
  userId: string;
  courseId: string;
  status: SelectionStatus;
  selectedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
}

export interface SelectionConflict {
  courseId: string;
  courseCode: string;
  courseName: string;
  conflictType: 'time_overlap' | 'prerequisite_not_met' | 'capacity_full';
  details: string;
}

export interface CreateSelectionRequest {
  courseId: string;
  notes?: string;
}

export interface CheckConflictRequest {
  courseIds: string[];
}

export interface CheckConflictResponse {
  hasConflicts: boolean;
  conflicts: SelectionConflict[];
}

export class SelectionService {
  /**
   * Get user's course selections
   */
  async getUserSelections(userId?: string): Promise<Selection[]> {
    const url = userId ? `/selections?userId=${userId}` : '/selections';
    const response = await apiService.get(url);
    return response.data;
  }

  /**
   * Select a course
   */
  async selectCourse(request: CreateSelectionRequest): Promise<Selection> {
    const response = await apiService.post('/selections', request);
    return response.data;
  }

  /**
   * Cancel a course selection
   */
  async cancelSelection(selectionId: string): Promise<void> {
    await apiService.delete(`/selections/${selectionId}`);
  }

  /**
   * Check for selection conflicts
   */
  async checkConflicts(request: CheckConflictRequest): Promise<CheckConflictResponse> {
    const response = await apiService.post('/selections/check-conflicts', request);
    return response.data;
  }

  /**
   * Get selection by ID
   */
  async getSelectionById(selectionId: string): Promise<Selection> {
    const response = await apiService.get(`/selections/${selectionId}`);
    return response.data;
  }

  /**
   * Update selection status
   */
  async updateSelectionStatus(selectionId: string, status: SelectionStatus): Promise<Selection> {
    const response = await apiService.patch(`/selections/${selectionId}`, { status });
    return response.data;
  }

  /**
   * Get course selection statistics
   */
  async getSelectionStatistics(courseId: string): Promise<any> {
    const response = await apiService.get(`/selections/statistics?courseId=${courseId}`);
    return response.data;
  }

  /**
   * Check if user is selected for a specific course
   */
  async isUserSelectedForCourse(courseId: string, userId?: string): Promise<boolean> {
    const selections = await this.getUserSelections(userId);
    return selections.some(s => s.courseId === courseId && s.status === SelectionStatus.CONFIRMED);
  }

  /**
   * Get user's selection history
   */
  async getSelectionHistory(userId?: string, page = 1, limit = 20): Promise<{
    data: Selection[];
    total: number;
    page: number;
    limit: number;
  }> {
    const url = userId
      ? `/selections/history?userId=${userId}&page=${page}&limit=${limit}`
      : `/selections/history?page=${page}&limit=${limit}`;
    const response = await apiService.get(url);
    return response.data;
  }

  /**
   * Bulk select courses
   */
  async bulkSelectCourses(courseIds: string[]): Promise<{
    successful: Selection[];
    failed: Array<{ courseId: string; error: string }>;
  }> {
    const response = await apiService.post('/selections/bulk', { courseIds });
    return response.data;
  }

  /**
   * Export selections to different formats
   */
  async exportSelections(format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: any): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format,
      ...filters
    } as any);

    const client = apiService.getClient();
    const response = await client.get(`/selections/export?${queryParams}`, {
      responseType: 'blob'
    });

    return response.data;
  }
}

// Create singleton instance
export const selectionService = new SelectionService();
export default selectionService;