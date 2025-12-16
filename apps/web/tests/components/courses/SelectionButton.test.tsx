import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import SelectionButton from '@/components/courses/CourseDetail/SelectionButton';
import { SelectionStatus } from '@/services/selectionService';

// Mock services
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

const renderWithAntd = (component: React.ReactElement) => {
  return render(
    <ConfigProvider>
      {component}
    </ConfigProvider>
  );
};

describe('SelectionButton Component', () => {
  const mockCourseId = 'course-123';
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockImplementation(() => new Promise(() => {}));

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows select button when course is selectable and not selected', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    expect(screen.getByText('已选: 25/50')).toBeInTheDocument();
    expect(screen.getByText('(50%)')).toBeInTheDocument();
  });

  it('shows selected button when course is already selected', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(true);

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已选课程')).toBeInTheDocument();
    });
  });

  it('shows disabled button when course is full', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={false}
        isFull={true}
        enrolled={50}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已满员')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows disabled button when course is not selectable', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={false}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('不可选')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles course selection without conflicts', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);
    selectionService.checkConflicts.mockResolvedValue({
      hasConflicts: false,
      conflicts: [],
    });
    selectionService.selectCourse.mockResolvedValue({});

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    const selectButton = screen.getByRole('button', { name: '选课' });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(selectionService.checkConflicts).toHaveBeenCalledWith({
        courseIds: [mockCourseId],
      });
    });

    await waitFor(() => {
      expect(selectionService.selectCourse).toHaveBeenCalledWith({
        courseId: mockCourseId,
      });
    });

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
  });

  it('shows conflict modal when conflicts exist', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);
    selectionService.checkConflicts.mockResolvedValue({
      hasConflicts: true,
      conflicts: [
        {
          courseId: 'conflict-course',
          courseCode: 'CS102',
          courseName: 'Data Structures',
          conflictType: 'time_overlap',
          details: 'Time conflict with Data Structures course',
        },
      ],
    });

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    const selectButton = screen.getByRole('button', { name: '选课' });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('选课冲突提醒')).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Time conflict with Data Structures course')).toBeInTheDocument();
    });
  });

  it('handles course selection confirmation with conflicts', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);
    selectionService.checkConflicts.mockResolvedValue({
      hasConflicts: true,
      conflicts: [
        {
          courseId: 'conflict-course',
          courseCode: 'CS102',
          courseName: 'Data Structures',
          conflictType: 'time_overlap',
          details: 'Time conflict with Data Structures course',
        },
      ],
    });
    selectionService.selectCourse.mockResolvedValue({});

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    const selectButton = screen.getByRole('button', { name: '选课' });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('选课冲突提醒')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: '确认选课' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(selectionService.selectCourse).toHaveBeenCalledWith({
        courseId: mockCourseId,
      });
    });

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
  });

  it('handles course cancellation', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(true);
    selectionService.getUserSelections.mockResolvedValue([
      {
        id: 'selection-123',
        userId: 'user-123',
        courseId: mockCourseId,
        status: SelectionStatus.CONFIRMED,
        selectedAt: new Date(),
      },
    ]);
    selectionService.cancelSelection.mockResolvedValue();

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已选课程')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: '已选课程' });
    fireEvent.click(cancelButton);

    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('确认退课')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: '确认退课' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(selectionService.cancelSelection).toHaveBeenCalledWith('selection-123');
    });

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
  });

  it('handles selection error', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);
    selectionService.checkConflicts.mockResolvedValue({
      hasConflicts: false,
      conflicts: [],
    });
    selectionService.selectCourse.mockRejectedValue(new Error('Selection failed'));

    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={25}
        capacity={50}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    const selectButton = screen.getByRole('button', { name: '选课' });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('选课失败，请重试');
    });

    mockAlert.mockRestore();
  });

  it('displays correct enrollment information', async () => {
    const { selectionService } = require('@/services/selectionService');
    selectionService.isUserSelectedForCourse.mockResolvedValue(false);

    renderWithAntd(
      <SelectionButton
        courseId={mockCourseId}
        isSelectable={true}
        isFull={false}
        enrolled={35}
        capacity={70}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('选课')).toBeInTheDocument();
    });

    expect(screen.getByText('已选: 35/70')).toBeInTheDocument();
    expect(screen.getByText('(50%)')).toBeInTheDocument();
  });
});