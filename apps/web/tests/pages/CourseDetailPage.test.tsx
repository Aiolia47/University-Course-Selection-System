import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from '@/stores';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';
import { Course, CourseStatus } from '@/types/course';

// Mock services
jest.mock('@/services/courseService', () => ({
  courseService: {
    getCourseById: jest.fn(),
    trackCourseView: jest.fn(),
    refreshCourse: jest.fn(),
  },
}));

jest.mock('@/services/selectionService', () => ({
  selectionService: {
    isUserSelectedForCourse: jest.fn(),
    selectCourse: jest.fn(),
    cancelSelection: jest.fn(),
    checkConflicts: jest.fn(),
    getUserSelections: jest.fn(),
  },
  SelectionStatus: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },
}));

jest.mock('@/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'user123', role: 'student' })),
  },
}));

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock IndexedDB
const mockDB = {
  onupgradeneeded: null,
  onsuccess: null,
  onerror: null,
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => ({
        onsuccess: null,
        onerror: null,
      })),
      put: jest.fn(),
    })),
  })),
};

jest.mock('indexedDB', () => ({
  open: jest.fn(() => mockDB),
}));

const mockCourse: Course = {
  id: 'course-123',
  code: 'CS101',
  name: 'Introduction to Computer Science',
  description: 'A comprehensive introduction to computer science fundamentals including programming concepts, algorithms, and data structures.',
  credits: 3,
  teacher: 'Dr. John Smith',
  capacity: 50,
  enrolled: 25,
  status: CourseStatus.PUBLISHED,
  schedules: [
    {
      dayOfWeek: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      endTime: '10:30',
      location: 'Room 101',
      weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    },
  ],
  prerequisites: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderWithRouterAndProviders = (initialEntries: string[] = ['/courses/course-123']) => {
  const history = createMemoryHistory({ initialEntries });

  return render(
    <Provider store={store}>
      <ConfigProvider>
        <Router history={history}>
          <CourseDetailPage />
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

describe('CourseDetailPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the complete course detail page', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById.mockResolvedValue(mockCourse);
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithRouterAndProviders();

    // Check loading state
    expect(screen.getByText('加载课程详情中...')).toBeInTheDocument();

    // Wait for course to load
    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    // Check breadcrumb navigation
    expect(screen.getByText('课程列表')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();

    // Check course header
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('3 学分')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('已发布')).toBeInTheDocument();
    expect(screen.getByText('已选: 25/50')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check selection button
    expect(screen.getByRole('button', { name: '选课' })).toBeInTheDocument();

    // Check course info section
    expect(screen.getByText('课程信息')).toBeInTheDocument();
    expect(screen.getByText('课程描述')).toBeInTheDocument();
    expect(screen.getByText('考核方式')).toBeInTheDocument();

    // Check course schedule section
    expect(screen.getByText('课程安排')).toBeInTheDocument();
    expect(screen.getByText('周一、周三、周五')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:30')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();

    // Check teacher info section
    expect(screen.getByText('教师信息')).toBeInTheDocument();

    // Check course evaluation section
    expect(screen.getByText('课程评价')).toBeInTheDocument();

    // Check related courses section
    expect(screen.getByText('相关课程推荐')).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('button', { name: /返回/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /刷新/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /收藏/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享/i })).toBeInTheDocument();
  });

  it('handles navigation between different courses', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById
      .mockResolvedValueOnce(mockCourse)
      .mockResolvedValueOnce({
        ...mockCourse,
        id: 'course-456',
        code: 'CS102',
        name: 'Data Structures',
      });
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    const history = createMemoryHistory({ initialEntries: ['/courses/course-123'] });

    render(
      <Provider store={store}>
        <ConfigProvider>
          <Router history={history}>
            <CourseDetailPage />
          </Router>
        </ConfigProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    // Navigate to different course
    history.push('/courses/course-456');

    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
    });

    expect(screen.getByText('CS102')).toBeInTheDocument();
  });

  it('handles course selection workflow end-to-end', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById.mockResolvedValue(mockCourse);
    selectionService.isUserSelectedForCourse
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    selectionService.checkConflicts.mockResolvedValue({
      hasConflicts: false,
      conflicts: [],
    });
    selectionService.selectCourse.mockResolvedValue({});

    renderWithRouterAndProviders();

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    // Click select button
    const selectButton = screen.getByRole('button', { name: '选课' });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(selectionService.selectCourse).toHaveBeenCalledWith({
        courseId: 'course-123',
      });
    });

    // Simulate selection state change
    courseService.getCourseById.mockResolvedValue({
      ...mockCourse,
      enrolled: 26,
    });

    // Refresh to show updated state
    const refreshButton = screen.getByRole('button', { name: /刷新/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(courseService.refreshCourse).toHaveBeenCalledWith('course-123');
    });
  });

  it('handles course cancellation workflow end-to-end', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById.mockResolvedValue(mockCourse);
    selectionService.isUserSelectedForCourse.mockResolvedValue(true);
    selectionService.getUserSelections.mockResolvedValue([
      {
        id: 'selection-123',
        userId: 'user-123',
        courseId: 'course-123',
        status: 'confirmed',
        selectedAt: new Date(),
      },
    ]);
    selectionService.cancelSelection.mockResolvedValue();

    renderWithRouterAndProviders();

    await waitFor(() => {
      expect(screen.getByText('已选课程')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: '已选课程' });
    fireEvent.click(cancelButton);

    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('确认退课')).toBeInTheDocument();
    });

    // Confirm cancellation
    const confirmButton = screen.getByRole('button', { name: '确认退课' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(selectionService.cancelSelection).toHaveBeenCalledWith('selection-123');
    });
  });

  it('handles error states gracefully', async () => {
    const { courseService } = require('@/services/courseService');

    courseService.getCourseById.mockRejectedValue(new Error('Course not found'));

    renderWithRouterAndProviders();

    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });

    expect(screen.getByText('Course not found')).toBeInTheDocument();

    // Test retry functionality
    courseService.getCourseById.mockResolvedValue(mockCourse);

    const retryButton = screen.getByRole('button', { name: '重试' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });
  });

  it('handles related courses navigation', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById.mockResolvedValue(mockCourse);
    courseService.getPopularCourses.mockResolvedValue({
      data: [
        {
          id: 'related-123',
          code: 'CS201',
          name: 'Algorithms',
          description: 'Advanced algorithm design and analysis',
          credits: 4,
          teacher: 'Dr. Jane Doe',
          capacity: 40,
          enrolled: 20,
          status: CourseStatus.PUBLISHED,
          schedules: [],
          prerequisites: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithRouterAndProviders();

    await waitFor(() => {
      expect(screen.getByText('相关课程推荐')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Algorithms')).toBeInTheDocument();
    });

    // Test clicking on related course
    const relatedCourseLink = screen.getByText('Algorithms');
    fireEvent.click(relatedCourseLink);

    // Verify navigation happened
    expect(window.location.pathname).toBe('/courses/related-123');
  });

  it('handles sharing functionality', async () => {
    const { courseService } = require('@/services/courseService');
    const { selectionService } = require('@/services/selectionService');

    courseService.getCourseById.mockResolvedValue(mockCourse);
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });

    renderWithRouterAndProviders();

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    // Test share functionality
    const shareButton = screen.getByRole('button', { name: /分享/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('分享课程')).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: '复制链接' });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/courses/course-123')
      );
    });
  });
});