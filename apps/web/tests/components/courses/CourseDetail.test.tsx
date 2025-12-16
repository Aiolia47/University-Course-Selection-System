import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from '@/stores';
import CourseDetail from '@/components/courses/CourseDetail/CourseDetail';
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

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

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockCourse: Course = {
  id: 'course-123',
  code: 'CS101',
  name: 'Introduction to Computer Science',
  description: 'A comprehensive introduction to computer science fundamentals.',
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

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/courses/course-123']) => {
  return render(
    <Provider store={store}>
      <ConfigProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </ConfigProvider>
    </Provider>
  );
};

describe('CourseDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<CourseDetail courseId="course-123" />);

    expect(screen.getByText('加载课程详情中...')).toBeInTheDocument();
  });

  it('renders course information when loaded successfully', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('3 学分')).toBeInTheDocument();
    expect(screen.getByText('已选: 25/50')).toBeInTheDocument();
  });

  it('handles course loading error', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockRejectedValue(new Error('Failed to load course'));

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load course')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('课程列表')).toBeInTheDocument();
    });

    expect(screen.getByText('课程列表')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
  });

  it('handles refresh functionality', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);
    courseService.refreshCourse.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /刷新/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(courseService.refreshCourse).toHaveBeenCalledWith('course-123');
    });
  });

  it('handles share functionality', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    const shareButton = screen.getByRole('button', { name: /分享/i });
    fireEvent.click(shareButton);

    expect(screen.getByText('分享课程')).toBeInTheDocument();
    expect(screen.getByText('复制链接')).toBeInTheDocument();
  });

  it('handles favorite toggle', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    const favoriteButton = screen.getByRole('button', { name: /收藏/i });
    fireEvent.click(favoriteButton);

    // Check if the button changes state
    expect(favoriteButton).toHaveClass('ant-btn-primary');
  });

  it('displays correct status tag', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('已发布')).toBeInTheDocument();
  });

  it('shows correct enrollment rate', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles full course state', async () => {
    const fullCourse = {
      ...mockCourse,
      enrolled: 50,
    };

    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(fullCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('已选: 50/50')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles course with no schedules', async () => {
    const courseWithoutSchedules = {
      ...mockCourse,
      schedules: [],
    };

    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(courseWithoutSchedules);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('待定')).toBeInTheDocument();
  });

  it('handles course with prerequisites', async () => {
    const courseWithPrereqs = {
      ...mockCourse,
      prerequisites: [
        {
          courseId: 'course-100',
          courseCode: 'CS100',
          courseName: 'Introduction to Programming',
          minimumGrade: 70,
        },
      ],
    };

    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(courseWithPrereqs);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('CS100 - Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('(最低分: 70)')).toBeInTheDocument();
  });

  it('handles copy link functionality', async () => {
    const { courseService } = require('@/services/courseService');
    courseService.getCourseById.mockResolvedValue(mockCourse);

    renderWithProviders(<CourseDetail courseId="course-123" />);

    await waitFor(() => {
      expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    });

    const shareButton = screen.getByRole('button', { name: /分享/i });
    fireEvent.click(shareButton);

    const copyButton = screen.getByRole('button', { name: /复制链接/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/courses/course-123')
      );
    });
  });
});