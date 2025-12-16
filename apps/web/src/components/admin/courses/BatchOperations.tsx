import React from 'react';
import {
  Button,
  Dropdown,
  Menu,
  Modal,
  message,
  Space,
  Badge,
  Tag
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { CourseStatus } from '@/types/course';

interface BatchOperationsProps {
  selectedIds: string[];
  onBatchOperation: (operation: string, courseIds: string[]) => void;
  onDelete: (courseIds: string[]) => void;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  selectedIds,
  onBatchOperation,
  onDelete
}) => {
  const handleBatchAction = (action: string) => {
    switch (action) {
      case 'delete':
        Modal.confirm({
          title: 'Confirm Bulk Delete',
          content: `Are you sure you want to delete ${selectedIds.length} selected course(s)? This action cannot be undone.`,
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => onDelete(selectedIds)
        });
        break;

      case 'publish':
        Modal.confirm({
          title: 'Confirm Bulk Publish',
          content: `Are you sure you want to publish ${selectedIds.length} selected course(s)?`,
          okText: 'Publish',
          onOk: () => onBatchOperation('publish', selectedIds)
        });
        break;

      case 'unpublish':
        Modal.confirm({
          title: 'Confirm Bulk Unpublish',
          content: `Are you sure you want to unpublish ${selectedIds.length} selected course(s)?`,
          okText: 'Unpublish',
          onOk: () => onBatchOperation('unpublish', selectedIds)
        });
        break;

      case 'cancel':
        Modal.confirm({
          title: 'Confirm Bulk Cancel',
          content: `Are you sure you want to cancel ${selectedIds.length} selected course(s)?`,
          okText: 'Cancel',
          okType: 'danger',
          onOk: () => onBatchOperation('cancel', selectedIds)
        });
        break;

      case 'export':
        onBatchOperation('export', selectedIds);
        break;

      default:
        message.info('Action not implemented yet');
    }
  };

  const menu = (
    <Menu onClick={({ key }) => handleBatchAction(key)}>
      <Menu.Item key="publish" icon={<EditOutlined />}>
        Publish Selected
      </Menu.Item>
      <Menu.Item key="unpublish" icon={<EditOutlined />}>
        Unpublish Selected
      </Menu.Item>
      <Menu.Item key="cancel" icon={<EditOutlined />}>
        Cancel Selected
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="export" icon={<ExportOutlined />}>
        Export Selected
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger icon={<DeleteOutlined />}>
        Delete Selected
      </Menu.Item>
    </Menu>
  );

  return (
    <Space>
      <Badge count={selectedIds.length} showZero>
        <Tag color="blue">Selected</Tag>
      </Badge>
      <Dropdown overlay={menu} placement="bottomRight">
        <Button icon={<MoreOutlined />}>
          Bulk Actions
        </Button>
      </Dropdown>
    </Space>
  );
};

export default BatchOperations;