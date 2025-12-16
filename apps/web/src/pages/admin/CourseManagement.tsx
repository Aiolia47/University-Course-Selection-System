import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Upload,
  Row,
  Col,
  Statistic,
  Tag,
  Input,
  Select,
  Drawer,
  Tabs,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { CourseService } from '@/services/courseService';
import { Course, CourseStatus } from '@/types/course';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { BatchOperations } from '@/components/admin/courses/BatchOperations';
import { ImportExport } from '@/components/admin/courses/ImportExport';
import { OperationHistory } from '@/components/admin/courses/OperationHistory';
import { formatDateTime } from '@/utils/date';
import { hasPermission } from '@/utils/permissions';
import styles from '@/styles/pages/CourseManagement.module.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface CourseManagementProps {}

export const CourseManagement: React.FC<CourseManagementProps> = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Import/Export states
  const [importExportVisible, setImportExportVisible] = useState(false);

  // History states
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedCourseForHistory, setSelectedCourseForHistory] = useState<Course | null>(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    published: 0,
    draft: 0,
    cancelled: 0
  });

  const courseService = new CourseService();

  // Permission checks
  const canCreate = hasPermission(user, 'course.create');
  const canUpdate = hasPermission(user, 'course.update');
  const canDelete = hasPermission(user, 'course.delete');
  const canBatch = hasPermission(user, 'course.batch');

  useEffect(() => {
    loadCourses();
    loadStatistics();
  }, [pagination.current, pagination.pageSize, searchTerm, statusFilter]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourses({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setCourses(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // This would be implemented in the backend
      const stats = await courseService.getCourseStatistics('admin');
      setStatistics(stats);
    } catch (error) {
      // Fallback to client-side calculation
      const published = courses.filter(c => c.status === CourseStatus.PUBLISHED).length;
      const draft = courses.filter(c => c.status === CourseStatus.DRAFT).length;
      const cancelled = courses.filter(c => c.status === CourseStatus.CANCELLED).length;

      setStatistics({
        total: courses.length,
        published,
        draft,
        cancelled
      });
    }
  };

  const handleCreate = () => {
    if (!canCreate) {
      message.error('You do not have permission to create courses');
      return;
    }

    setEditingCourse(null);
    setFormVisible(true);
  };

  const handleEdit = (course: Course) => {
    if (!canUpdate) {
      message.error('You do not have permission to edit courses');
      return;
    }

    setEditingCourse(course);
    setFormVisible(true);
  };

  const handleDelete = async (courseIds: string[]) => {
    if (!canDelete) {
      message.error('You do not have permission to delete courses');
      return;
    }

    try {
      await Promise.all(
        courseIds.map(id => courseService.deleteCourse(id))
      );

      message.success(`Deleted ${courseIds.length} course(s) successfully`);
      setSelectedRowKeys([]);
      loadCourses();
      loadStatistics();
    } catch (error) {
      message.error('Failed to delete course(s)');
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, values);
        message.success('Course updated successfully');
      } else {
        await courseService.createCourse(values);
        message.success('Course created successfully');
      }

      setFormVisible(false);
      loadCourses();
      loadStatistics();
    } catch (error) {
      message.error(editingCourse ? 'Failed to update course' : 'Failed to create course');
    } finally {
      setFormLoading(false);
    }
  };

  const handleBatchOperation = async (operation: string, courseIds: string[]) => {
    if (!canBatch) {
      message.error('You do not have permission to perform batch operations');
      return;
    }

    try {
      await courseService.batchOperation(operation, courseIds);
      message.success(`Batch ${operation} completed successfully`);
      setSelectedRowKeys([]);
      loadCourses();
      loadStatistics();
    } catch (error) {
      message.error(`Failed to perform batch ${operation}`);
    }
  };

  const handleViewHistory = (course: Course) => {
    setSelectedCourseForHistory(course);
    setHistoryVisible(true);
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'Course Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 150,
      sorter: (a, b) => a.teacher.localeCompare(b.teacher),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      sorter: (a, b) => a.credits - b.credits,
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: 'Enrolled',
      dataIndex: 'enrolled',
      key: 'enrolled',
      width: 100,
      sorter: (a, b) => a.enrolled - b.enrolled,
      render: (enrolled, record) => (
        <span className={enrolled >= record.capacity ? styles.fullCapacity : ''}>
          {enrolled}/{record.capacity}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: CourseStatus) => {
        const colorMap = {
          [CourseStatus.DRAFT]: 'orange',
          [CourseStatus.PUBLISHED]: 'green',
          [CourseStatus.CANCELLED]: 'red',
          [CourseStatus.COMPLETED]: 'blue'
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={!canUpdate}
            />
          </Tooltip>
          <Tooltip title="View History">
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this course?"
            onConfirm={() => handleDelete([record.id])}
            okText="Yes"
            cancelText="No"
            disabled={!canDelete}
          >
            <Tooltip title="Delete">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={!canDelete}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: Course) => ({
      disabled: !canBatch,
    }),
  };

  return (
    <div className={styles.courseManagement}>
      {/* Statistics Cards */}
      <Row gutter={16} className={styles.statistics}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Courses" value={statistics.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Published" value={statistics.published} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Draft" value={statistics.draft} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Cancelled" value={statistics.cancelled} valueStyle={{ color: '#d4b106' }} />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title="Course Management"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadCourses}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              disabled={!canCreate}
            >
              Create Course
            </Button>
          </Space>
        }
      >
        {/* Filters and Actions */}
        <Row gutter={16} className={styles.filters}>
          <Col span={8}>
            <Search
              placeholder="Search courses..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={loadCourses}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value={CourseStatus.DRAFT}>Draft</Option>
              <Option value={CourseStatus.PUBLISHED}>Published</Option>
              <Option value={CourseStatus.CANCELLED}>Cancelled</Option>
              <Option value={CourseStatus.COMPLETED}>Completed</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Space>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setImportExportVisible(true)}
              >
                Import/Export
              </Button>
              {selectedRowKeys.length > 0 && (
                <BatchOperations
                  selectedIds={selectedRowKeys}
                  onBatchOperation={handleBatchOperation}
                  onDelete={(ids) => handleDelete(ids)}
                />
              )}
            </Space>
          </Col>
        </Row>

        {/* Course Table */}
        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} courses`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }));
            }
          }}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          className={styles.courseTable}
        />
      </Card>

      {/* Course Form Modal */}
      <Modal
        title={editingCourse ? 'Edit Course' : 'Create Course'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CourseForm
          course={editingCourse}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormVisible(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Import/Export Drawer */}
      <Drawer
        title="Import/Export Courses"
        placement="right"
        onClose={() => setImportExportVisible(false)}
        open={importExportVisible}
        width={600}
      >
        <ImportExport
          onImportSuccess={() => {
            setImportExportVisible(false);
            loadCourses();
            loadStatistics();
          }}
        />
      </Drawer>

      {/* Operation History Drawer */}
      <Drawer
        title={`Operation History - ${selectedCourseForHistory?.name}`}
        placement="right"
        onClose={() => setHistoryVisible(false)}
        open={historyVisible}
        width={600}
      >
        {selectedCourseForHistory && (
          <OperationHistory courseId={selectedCourseForHistory.id} />
        )}
      </Drawer>
    </div>
  );
};

export default CourseManagement;