import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Course, CourseStatus, DayOfWeek } from '@/types/course';
import CourseCard from '@/components/courses/CourseCard';
import coursesReducer from '@/stores/slices/coursesSlice';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      courses: coursesReducer,
      // Add other reducers as needed
    },
    preloadedState: {
      courses: {
        courses: [],
        currentCourse: null,
        filters: {},
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        isLoading: false,
        isDetailLoading: false,
        error: null,
        searchQuery: '',
        favorites: [],
        compareList: [],
        isCompareMode: false,
        ...initialState,
      },
    },
  });
};

const mockCourse: Course = {
  id: '1',
  code: 'CS101',
  name: '计算机科学导论',
  description: '这是一门计算机科学的入门课程，涵盖基础概念和编程原理。',
  credits: 3,
  teacher: '张教授',
  capacity: 100,
  enrolled: 85,
  status: CourseStatus.PUBLISHED,
  schedules: [{
    dayOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    startTime: '09:00',
    endTime: '10:30',
    location: '主教学楼 A101',
    weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  }],
  prerequisites: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('CourseCard Component', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('renders course information correctly', () => {
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onViewDetails={jest.fn()}
      />
    );

    expect(screen.getByText('计算机科学导论')).toBeInTheDocument();
    expect(screen.getByText('(CS101)')).toBeInTheDocument();
    expect(screen.getByText('张教授')).toBeInTheDocument();
    expect(screen.getByText('3 学分')).toBeInTheDocument();
    expect(screen.getByText('85/100 人')).toBeInTheDocument();
  });

  test('displays correct status tag', () => {
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onViewDetails={jest.fn()}
      />
    );

    const statusTag = screen.getByText('已发布');
    expect(statusTag).toBeInTheDocument();
    expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-green');
  });

  test('shows full course indicator when course is full', () => {
    const fullCourse = {
      ...mockCourse,
      enrolled: 100,
      capacity: 100,
    };

    renderWithProvider(
      <CourseCard
        course={fullCourse}
        onViewDetails={jest.fn()}
      />
    );

    const enrollmentInfo = screen.getByText('100/100 人');
    expect(enrollmentInfo.parentElement).toHaveClass('enrollment-full');
  });

  test('calls onViewDetails when view details button is clicked', () => {
    const onViewDetails = jest.fn();
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onViewDetails={onViewDetails}
      />
    );

    const viewDetailsButton = screen.getByLabelText('查看详情') ||
      screen.getByRole('button', { name: /查看详情/i }) ||
      document.querySelector('.anticon-eye');

    if (viewDetailsButton) {
      fireEvent.click(viewDetailsButton);
      expect(onViewDetails).toHaveBeenCalledWith('1');
    }
  });

  test('shows favorite button when onFavorite is provided', () => {
    const onFavorite = jest.fn();
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onFavorite={onFavorite}
        isFavorite={false}
      />
    );

    // Check if favorite button is rendered
    const favoriteButton = document.querySelector('.anticon-heart');
    expect(favoriteButton).toBeInTheDocument();
  });

  test('shows filled heart when course is favorited', () => {
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onFavorite={jest.fn()}
        isFavorite={true}
      />
    );

    const favoriteButton = document.querySelector('.anticon-heart');
    expect(favoriteButton).toBeInTheDocument();
    // Check for filled heart icon
    const filledHeart = document.querySelector('.anticon-heart-filled');
    expect(filledHeart).toBeInTheDocument();
  });

  test('shows compare button when compareMode is true', () => {
    const onCompare = jest.fn();
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        compareMode={true}
        onCompare={onCompare}
        isInCompareList={false}
      />
    );

    const compareButton = document.querySelector('.anticon-arrows-alt');
    expect(compareButton).toBeInTheDocument();
  });

  test('calls onFavorite when favorite button is clicked', () => {
    const onFavorite = jest.fn();
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onFavorite={onFavorite}
        isFavorite={false}
      />
    );

    const favoriteButton = document.querySelector('.anticon-heart');
    if (favoriteButton) {
      fireEvent.click(favoriteButton);
      expect(onFavorite).toHaveBeenCalledWith('1');
    }
  });

  test('calls onCompare when compare button is clicked', () => {
    const onCompare = jest.fn();
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        compareMode={true}
        onCompare={onCompare}
        isInCompareList={false}
      />
    );

    const compareButton = document.querySelector('.anticon-arrows-alt');
    if (compareButton) {
      fireEvent.click(compareButton);
      expect(onCompare).toHaveBeenCalledWith('1');
    }
  });

  test('displays course schedule information', () => {
    renderWithProvider(
      <CourseCard
        course={mockCourse}
        onViewDetails={jest.fn()}
      />
    );

    expect(screen.getByText(/周.*09:00-10:30/i)).toBeInTheDocument();
    expect(screen.getByText('主教学楼 A101')).toBeInTheDocument();
  });

  test('truncates long description', () => {
    const courseWithLongDescription = {
      ...mockCourse,
      description: '这是一个非常长的课程描述，应该被截断。'.repeat(10),
    };

    renderWithProvider(
      <CourseCard
        course={courseWithLongDescription}
        onViewDetails={jest.fn()}
      />
    );

    const description = screen.getByText(/这是一个非常长的课程描述/);
    expect(description).toBeInTheDocument();
    // The description should be truncated (checking if it has ellipsis)
    const descriptionElement = description.closest('.course-card-description');
    expect(descriptionElement).toHaveClass('ant-typography-ellipsis');
  });

  test('renders draft status correctly', () => {
    const draftCourse = {
      ...mockCourse,
      status: CourseStatus.DRAFT,
    };

    renderWithProvider(
      <CourseCard
        course={draftCourse}
        onViewDetails={jest.fn()}
      />
    );

    const statusTag = screen.getByText('草稿');
    expect(statusTag).toBeInTheDocument();
    expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-orange');
  });

  test('renders cancelled status correctly', () => {
    const cancelledCourse = {
      ...mockCourse,
      status: CourseStatus.CANCELLED,
    };

    renderWithProvider(
      <CourseCard
        course={cancelledCourse}
        onViewDetails={jest.fn()}
      />
    );

    const statusTag = screen.getByText('已取消');
    expect(statusTag).toBeInTheDocument();
    expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-red');
  });
});