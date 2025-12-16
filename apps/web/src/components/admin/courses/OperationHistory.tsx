import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Typography,
  Tooltip,
  Modal,
  Descriptions,
  message
} from 'antd';
import {
  UndoOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/date';
import { courseService } from '@/services/courseService';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

interface OperationHistory {
  id: string;
  courseId: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_OPERATION';
  operation: string;
  performedBy: string;
  performedAt: string;
  previousData?: any;
  newData?: any;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

interface OperationHistoryProps {
  courseId: string;
}

export const OperationHistory: React.FC<OperationHistoryProps> = ({ courseId }) => {
  const [history, setHistory] = useState<OperationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    operation: '',
    status: '',
    dateRange: null as any
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationHistory | null>(null);

  useEffect(() => {
    loadHistory();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await courseService.getOperationHistory(courseId, {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        operation: filters.operation || undefined,
        status: filters.status || undefined,
        startDate: filters.dateRange?.[0]?.toISOString(),
        endDate: filters.dateRange?.[1]?.toISOString()
      });

      setHistory(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      message.error('Failed to load operation history');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (operationId: string) => {
    Modal.confirm({
      title: 'Confirm Revert Operation',
      content: 'Are you sure you want to revert this operation? This will restore the previous state.',
      okText: 'Revert',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await courseService.revertOperation(operationId);
          message.success('Operation reverted successfully');
          loadHistory();
        } catch (error) {
          message.error('Failed to revert operation');
        }
      }
    });
  };

  const showDetail = (operation: OperationHistory) => {
    setSelectedOperation(operation);
    setDetailVisible(true);
  };

  const columns: ColumnsType<OperationHistory> = [
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      render: (operation: string) => {
        const colorMap: Record<string, string> = {
          'create': 'green',
          'update': 'blue',
          'delete': 'red',
          'publish': 'cyan',
          'unpublish': 'orange',
          'cancel': 'magenta',
          'batch_update': 'purple'
        };
        return <Tag color={colorMap[operation] || 'default'}>{operation.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
    },
    {
      title: 'Date & Time',
      dataIndex: 'performedAt',
      key: 'performedAt',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showDetail(record)}
            />
          </Tooltip>
          {record.status === 'SUCCESS' && record.previousData && (
            <Tooltip title="Revert Operation">
              <Button
                type="link"
                icon={<UndoOutlined />}
                onClick={() => handleRevert(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <Card size="small" className="mb-4">
        <Space wrap>
          <Search
            placeholder="Search operations..."
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onSearch={loadHistory}
          />
          <Select
            placeholder="Operation Type"
            style={{ width: 150 }}
            value={filters.operation}
            onChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
            allowClear
          >
            <Option value="create">Create</Option>
            <Option value="update">Update</Option>
            <Option value="delete">Delete</Option>
            <Option value="publish">Publish</Option>
            <Option value="unpublish">Unpublish</Option>
            <Option value="cancel">Cancel</Option>
          </Select>
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            allowClear
          >
            <Option value="SUCCESS">Success</Option>
            <Option value="FAILED">Failed</Option>
          </Select>
          <RangePicker
            placeholder={['Start Date', 'End Date']}
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadHistory}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* History Table */}
      <Table
        columns={columns}
        dataSource={history}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} operations`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }));
          }
        }}
        size="small"
      />

      {/* Operation Detail Modal */}
      <Modal
        title="Operation Details"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Close
          </Button>,
          selectedOperation && selectedOperation.status === 'SUCCESS' && selectedOperation.previousData && (
            <Button
              key="revert"
              type="primary"
              danger
              icon={<UndoOutlined />}
              onClick={() => {
                handleRevert(selectedOperation.id);
                setDetailVisible(false);
              }}
            >
              Revert Operation
            </Button>
          )
        ]}
        width={800}
      >
        {selectedOperation && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Operation">
                <Tag>{selectedOperation.operation.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Performed By">
                {selectedOperation.performedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Date & Time">
                {formatDateTime(selectedOperation.performedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedOperation.status === 'SUCCESS' ? 'green' : 'red'}>
                  {selectedOperation.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedOperation.errorMessage && (
              <Card title="Error Message" size="small" className="mt-4">
                <Text type="danger">{selectedOperation.errorMessage}</Text>
              </Card>
            )}

            {selectedOperation.changes && selectedOperation.changes.length > 0 && (
              <Card title="Changes Made" size="small" className="mt-4">
                <Table
                  dataSource={selectedOperation.changes}
                  columns={[
                    {
                      title: 'Field',
                      dataIndex: 'field',
                      key: 'field',
                    },
                    {
                      title: 'Previous Value',
                      dataIndex: 'oldValue',
                      key: 'oldValue',
                      render: (value) => value || '-',
                    },
                    {
                      title: 'New Value',
                      dataIndex: 'newValue',
                      key: 'newValue',
                      render: (value) => value || '-',
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {selectedOperation.previousData && (
              <Card title="Previous Data" size="small" className="mt-4">
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(selectedOperation.previousData, null, 2)}
                </pre>
              </Card>
            )}

            {selectedOperation.newData && (
              <Card title="New Data" size="small" className="mt-4">
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(selectedOperation.newData, null, 2)}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OperationHistory;