import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Spin, Alert, Space } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { selectionService, SelectionConflict } from '@/services/selectionService';
import { courseService } from '@/services/courseService';
import styles from './CourseDetail.module.css';

interface SelectionButtonProps {
  courseId: string;
  isSelectable?: boolean;
  isFull?: boolean;
  enrolled?: number;
  capacity?: number;
  onSelectionChange?: () => void;
}

const SelectionButton: React.FC<SelectionButtonProps> = ({
  courseId,
  isSelectable = true,
  isFull = false,
  enrolled = 0,
  capacity = 0,
  onSelectionChange
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadySelected, setIsAlreadySelected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conflicts, setConflicts] = useState<SelectionConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Check if user is already selected for this course
  const checkSelectionStatus = async () => {
    try {
      setIsLoading(true);
      const selected = await selectionService.isUserSelectedForCourse(courseId);
      setIsAlreadySelected(selected);
    } catch (error) {
      console.error('Failed to check selection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSelectionStatus();
  }, [courseId]);

  // Check for conflicts before selection
  const checkConflicts = async () => {
    try {
      setCheckingConflicts(true);
      const result = await selectionService.checkConflicts({
        courseIds: [courseId]
      });

      setConflicts(result.conflicts);
      return result.hasConflicts;
    } catch (error) {
      message.error('检查选课冲突失败');
      return true; // Assume conflict to prevent selection on error
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Handle selection
  const handleSelect = async () => {
    if (!isSelectable || isFull) {
      return;
    }

    // Check for conflicts
    const hasConflicts = await checkConflicts();
    if (hasConflicts && conflicts.length > 0) {
      setShowConfirmModal(true);
      return;
    }

    // No conflicts, proceed with selection
    performSelection();
  };

  // Perform the actual selection
  const performSelection = async () => {
    try {
      setIsSelecting(true);
      await selectionService.selectCourse({ courseId });
      message.success('选课成功！');
      setIsAlreadySelected(true);
      setShowConfirmModal(false);
      onSelectionChange?.();
    } catch (error: any) {
      message.error(error.message || '选课失败，请重试');
    } finally {
      setIsSelecting(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    if (!isAlreadySelected) {
      return;
    }

    Modal.confirm({
      title: '确认退课',
      content: '确定要退选这门课程吗？此操作不可恢复。',
      okText: '确认退课',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setIsSelecting(true);

          // Get user's selections to find the selection ID
          const selections = await selectionService.getUserSelections();
          const selection = selections.find(s => s.courseId === courseId);

          if (!selection) {
            message.error('未找到选课记录');
            return;
          }

          await selectionService.cancelSelection(selection.id);
          message.success('退课成功！');
          setIsAlreadySelected(false);
          onSelectionChange?.();
        } catch (error: any) {
          message.error(error.message || '退课失败，请重试');
        } finally {
          setIsSelecting(false);
        }
      }
    });
  };

  // Get button text and type based on state
  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: '加载中...',
        icon: <LoadingOutlined />,
        type: 'default' as const,
        disabled: true
      };
    }

    if (isSelecting) {
      return {
        text: '处理中...',
        icon: <LoadingOutlined />,
        type: 'default' as const,
        disabled: true
      };
    }

    if (isAlreadySelected) {
      return {
        text: '已选课程',
        icon: <CheckOutlined />,
        type: 'primary' as const,
        disabled: false
      };
    }

    if (!isSelectable) {
      return {
        text: '不可选',
        icon: <ExclamationCircleOutlined />,
        type: 'default' as const,
        disabled: true
      };
    }

    if (isFull) {
      return {
        text: '已满员',
        icon: <ExclamationCircleOutlined />,
        type: 'default' as const,
        disabled: true
      };
    }

    return {
      text: '选课',
      icon: <PlusOutlined />,
      type: 'primary' as const,
      disabled: false
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className={styles.selectionButton}>
      <Button
        type={buttonConfig.type}
        icon={buttonConfig.icon}
        loading={isLoading || isSelecting}
        disabled={buttonConfig.disabled}
        size="large"
        block
        onClick={isAlreadySelected ? handleCancel : handleSelect}
        danger={isAlreadySelected}
        className={isAlreadySelected ? styles.cancelButton : styles.selectButton}
      >
        {buttonConfig.text}
      </Button>

      {/* Enrollment Info */}
      {!isLoading && (
        <div className={styles.enrollmentInfo}>
          <span className={styles.enrollmentText}>
            已选: {enrolled}/{capacity}
          </span>
          <span className={styles.enrollmentRate}>
            ({Math.round((enrolled / capacity) * 100)}%)
          </span>
        </div>
      )}

      {/* Conflict Confirmation Modal */}
      <Modal
        title="选课冲突提醒"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={performSelection}
            loading={isSelecting}
            danger
          >
            确认选课
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="检测到选课冲突"
            description="选择此课程可能会与您已选择的课程产生冲突，请仔细查看以下信息："
            type="warning"
            showIcon
          />

          {conflicts.map((conflict, index) => (
            <Alert
              key={index}
              message={conflict.courseName}
              description={conflict.details}
              type="error"
              showIcon
            />
          ))}

          <p style={{ marginTop: 16, marginBottom: 0 }}>
            确定要继续选课吗？您可以联系教务处解决冲突问题。
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default SelectionButton;