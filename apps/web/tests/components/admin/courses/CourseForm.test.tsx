import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { Course, CourseStatus, DayOfWeek } from '@/types/course';
import { authSlice } from '@/stores/slices/authSlice';

// Mock dependencies
jest.mock('@/services/courseService', () => ({
  CourseService: jest.fn().mockImplementation(() => ({
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
  })),
}));

// Mock date utils
jest.mock('@/utils/date', () => ({
  formatDateTime: jest.fn((date) => date.toString()),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: { id: '1', username: 'admin', role: 'admin', email: 'admin@test.com', status: 'active', profile: { id: '1', firstName: 'Admin' } },
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
      {component}
    </Provider>
  );
};

describe('CourseForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Course Form', () => {
    it('should render form fields correctly', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Course Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Credits')).toBeInTheDocument();
      expect(screen.getByLabelText('Teacher')).toBeInTheDocument();
      expect(screen.getByLabelText('Capacity')).toBeInTheDocument();
    });

    it('should have default values set', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Status should default to DRAFT
      expect(screen.getByDisplayValue('DRAFT')).toBeInTheDocument();

      // Credits should default to 3
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();

      // Capacity should default to 30
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Course');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter course code')).toBeInTheDocument();
        expect(screen.getByText('Please enter course name')).toBeInTheDocument();
        expect(screen.getByText('Please enter course description')).toBeInTheDocument();
        expect(screen.getByText('Please enter credits')).toBeInTheDocument();
        expect(screen.getByText('Please enter teacher name')).toBeInTheDocument();
        expect(screen.getByText('Please enter course capacity')).toBeInTheDocument();
      });
    });

    it('should validate course code format', async () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const courseCodeInput = screen.getByLabelText('Course Code');
      fireEvent.change(courseCodeInput, { target: { value: 'INVALID_CODE' } });
      fireEvent.blur(courseCodeInput);

      await waitFor(() => {
        expect(screen.getByText('Code format should be like CS101 or MATH2001')).toBeInTheDocument();
      });
    });

    it('should submit form with correct data when valid', async () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in form fields
      fireEvent.change(screen.getByLabelText('Course Code'), { target: { value: 'CS101' } });
      fireEvent.change(screen.getByLabelText('Course Name'), { target: { value: 'Introduction to Computer Science' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A comprehensive introduction to computer science' } });
      fireEvent.change(screen.getByLabelText('Teacher'), { target: { value: 'Dr. John Smith' } });

      // Submit form
      const submitButton = screen.getByText('Create Course');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'CS101',
            name: 'Introduction to Computer Science',
            description: 'A comprehensive introduction to computer science',
            credits: 3,
            teacher: 'Dr. John Smith',
            capacity: 30,
            status: CourseStatus.DRAFT,
            schedules: expect.arrayContaining([
              expect.objectContaining({
                dayOfWeek: [],
                startTime: undefined,
                endTime: undefined,
                location: '',
                weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
              })
            ]),
            prerequisites: []
          })
        );
      });
    });
  });

  describe('Edit Course Form', () => {
    const mockCourse: Course = {
      id: '1',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      description: 'A comprehensive introduction to computer science',
      credits: 3,
      teacher: 'Dr. John Smith',
      capacity: 30,
      enrolled: 25,
      status: CourseStatus.PUBLISHED,
      schedules: [
        {
          dayOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
          startTime: '09:00',
          endTime: '10:30',
          location: 'Room 301',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        }
      ],
      prerequisites: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    it('should populate form with course data when editing', () => {
      renderWithProvider(
        <CourseForm
          course={mockCourse}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('CS101')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Introduction to Computer Science')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A comprehensive introduction to computer science')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PUBLISHED')).toBeInTheDocument();
    });

    it('should show "Update Course" button when editing', () => {
      renderWithProvider(
        <CourseForm
          course={mockCourse}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Update Course')).toBeInTheDocument();
      expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
    });
  });

  describe('Schedule Management', () => {
    it('should allow adding multiple schedules', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Initially there should be one schedule section
      expect(screen.getByText('Schedule 1')).toBeInTheDocument();

      // Click "Add Schedule" button
      const addScheduleButton = screen.getByText('Add Schedule');
      fireEvent.click(addScheduleButton);

      // Now there should be two schedule sections
      expect(screen.getByText('Schedule 1')).toBeInTheDocument();
      expect(screen.getByText('Schedule 2')).toBeInTheDocument();
    });

    it('should allow removing schedules (except the first one)', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Add a second schedule first
      const addScheduleButton = screen.getByText('Add Schedule');
      fireEvent.click(addScheduleButton);

      // Now remove the second schedule
      const removeButtons = screen.getAllByRole('button').filter(button =>
        button.querySelector('svg')?.getAttribute('data-icon') === 'minus-circle'
      );

      // Should have one remove button (for the second schedule)
      expect(removeButtons).toHaveLength(1);

      fireEvent.click(removeButtons[0]);

      // Should only have Schedule 1 now
      expect(screen.getByText('Schedule 1')).toBeInTheDocument();
      expect(screen.queryByText('Schedule 2')).not.toBeInTheDocument();
    });
  });

  describe('Prerequisites Management', () => {
    it('should allow adding multiple prerequisites', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Add prerequisite
      const addPrereqButton = screen.getByText('Add Prerequisite');
      fireEvent.click(addPrereqButton);

      // Should have an input for prerequisite
      const prereqInput = screen.getByPlaceholderText('e.g., CS101');
      expect(prereqInput).toBeInTheDocument();
    });

    it('should allow removing prerequisites', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Add a prerequisite first
      const addPrereqButton = screen.getByText('Add Prerequisite');
      fireEvent.click(addPrereqButton);

      // Now remove it
      const removeButtons = screen.getAllByRole('button').filter(button =>
        button.querySelector('svg')?.getAttribute('data-icon') === 'minus-circle'
      );

      fireEvent.click(removeButtons[removeButtons.length - 1]);

      // Should not have any prerequisite inputs now
      expect(screen.queryByPlaceholderText('e.g., CS101')).not.toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show loading state when submitting', () => {
      renderWithProvider(
        <CourseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      const submitButton = screen.getByText('Create Course');
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
    });
  });
});