import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { CourseManagement } from '@/pages/admin/CourseManagement';
import { Course, CourseStatus } from '@/types/course';
import { authSlice } from '@/stores/slices/authSlice';

// Mock dependencies
jest.mock('@/services/courseService', () => ({
  CourseService: jest.fn().mockImplementation(() => ({
    getCourses: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    batchOperation: jest.fn(),
    getCourseStatistics: jest.fn(),
  })),
}));

jest.mock('@/components/admin/courses/CourseForm', () => ({
  CourseForm: jest.fn(({ onSubmit, onCancel, loading }) => (
    <div data-testid="course-form">
      <button onClick={() => onSubmit({ code: 'CS101' })} disabled={loading}>
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )),
}));

jest.mock('@/components/admin/courses/BatchOperations', () => ({
  BatchOperations: jest.fn(({ selectedIds, onBatchOperation, onDelete }) => (
    <div data-testid="batch-operations">
      <span>Selected: {selectedIds.length}</span>
      <button onClick={() => onBatchOperation('publish', selectedIds)}>Publish</button>
      <button onClick={() => onDelete(selectedIds)}>Delete</button>
    </div>
  )),
}));

jest.mock('@/components/admin/courses/ImportExport', () => ({
  ImportExport: jest.fn(({ onImportSuccess }) => (
    <div data-testid="import-export">
      <button onClick={onImportSuccess}>Import Success</button>
    </div>
  )),
}));

jest.mock('@/components/admin/courses/OperationHistory', () => ({
  OperationHistory: jest.fn(({ courseId }) => (
    <div data-testid="operation-history">
      <span>History for course: {courseId}</span>
    </div>
  )),
}));

// Mock utils
jest.mock('@/utils/date', () => ({
  formatDateTime: jest.fn((date) => date.toString()),
}));

jest.mock('@/utils/permissions', () => ({
  hasPermission: jest.fn((user, permission) => {
    // Admin has all permissions
    return user?.role === 'admin';
  }),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: '1',
          username: 'admin',
          role: 'admin',
          email: 'admin@test.com',
          status: 'active',
          profile: { id: '1', firstName: 'Admin' }
        },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

const mockCourses: Course[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    description: 'Basic computer science concepts',
    credits: 3,
    teacher: 'Dr. Smith',
    capacity: 30,
    enrolled: 25,
    status: CourseStatus.PUBLISHED,
    schedules: [],
    prerequisites: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    code: 'CS102',
    name: 'Data Structures',
    description: 'Advanced data structures',
    credits: 4,
    teacher: 'Dr. Johnson',
    capacity: 25,
    enrolled: 20,
    status: CourseStatus.DRAFT,
    schedules: [],
    prerequisites: [],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('CourseManagement', () => {
  const mockCourseService = require('@/services/courseService').CourseService;
  let courseServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    courseServiceInstance = new mockCourseService();

    // Mock the default return values
    courseServiceInstance.getCourses.mockResolvedValue({
      data: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    });

    courseServiceInstance.getCourseStatistics.mockResolvedValue({
      total: 2,
      published: 1,
      draft: 1,
      cancelled: 0
    });
  });

  it('should render the course management page', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Course Management')).toBeInTheDocument();
    });

    // Check statistics cards
    await waitFor(() => {
      expect(screen.getByText('Total Courses')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  it('should load courses on component mount', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(courseServiceInstance.getCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('CS102')).toBeInTheDocument();
    });
  });

  it('should show loading state while loading courses', () => {
    // Make the service call hang
    courseServiceInstance.getCourses.mockReturnValue(new Promise(() => {}));

    renderWithProvider(<CourseManagement />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should display create course button for admin users', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });
  });

  it('should open course form modal when Create Course is clicked', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Course'));

    expect(screen.getByTestId('course-form')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, { target: { value: 'CS101' } });

    // Should trigger search after typing
    await waitFor(() => {
      expect(courseServiceInstance.getCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'CS101'
        })
      );
    });
  });

  it('should handle status filter', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });

    // Find and click the status select
    const statusSelect = screen.getByText('Status');
    fireEvent.click(statusSelect);

    // Select PUBLISHED status
    const publishedOption = screen.getByText('Published');
    fireEvent.click(publishedOption);

    await waitFor(() => {
      expect(courseServiceInstance.getCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published'
        })
      );
    });
  });

  it('should handle course editing', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Find and click edit button for CS101
    const editButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg')?.getAttribute('data-icon') === 'edit'
    );

    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('course-form')).toBeInTheDocument();
  });

  it('should handle course deletion', async () => {
    courseServiceInstance.deleteCourse.mockResolvedValue(undefined);

    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Find and click delete button for CS101
    const deleteButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg')?.getAttribute('data-icon') === 'delete'
    );

    fireEvent.click(deleteButtons[0]);

    // Confirm deletion in modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure to delete this course?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Yes');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(courseServiceInstance.deleteCourse).toHaveBeenCalledWith('1');
    });
  });

  it('should handle batch selection', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Select first course
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Skip the header checkbox

    // Should show batch operations
    await waitFor(() => {
      expect(screen.getByTestId('batch-operations')).toBeInTheDocument();
      expect(screen.getByText('Selected: 1')).toBeInTheDocument();
    });
  });

  it('should handle refresh functionality', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(courseServiceInstance.getCourses).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    });
  });

  it('should open import/export drawer', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Create Course')).toBeInTheDocument();
    });

    // Click Import/Export button
    const importExportButton = screen.getByText('Import/Export');
    fireEvent.click(importExportButton);

    expect(screen.getByTestId('import-export')).toBeInTheDocument();
  });

  it('should open operation history drawer', async () => {
    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Find and click history button for CS101
    const historyButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg')?.getAttribute('data-icon') === 'history'
    );

    fireEvent.click(historyButtons[0]);

    expect(screen.getByTestId('operation-history')).toBeInTheDocument();
    expect(screen.getByText('History for course: 1')).toBeInTheDocument();
  });

  it('should disable actions for non-admin users', async () => {
    const nonAdminState = {
      auth: {
        user: {
          id: '2',
          username: 'student',
          role: 'student',
          email: 'student@test.com',
          status: 'active',
          profile: { id: '2', firstName: 'Student' }
        },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    };

    renderWithProvider(<CourseManagement />, nonAdminState);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    // Create Course button should be disabled
    expect(screen.getByText('Create Course')).toBeDisabled();

    // Edit buttons should be disabled
    const editButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg')?.getAttribute('data-icon') === 'edit'
    );
    editButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should handle error states', async () => {
    courseServiceInstance.getCourses.mockRejectedValue(new Error('Failed to load courses'));

    renderWithProvider(<CourseManagement />);

    await waitFor(() => {
      // Should show error message
      expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
    });
  });
});