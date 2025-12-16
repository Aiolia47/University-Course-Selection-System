import React, { useState } from 'react';
import {
  Upload,
  Button,
  Card,
  Row,
  Col,
  Alert,
  Progress,
  Table,
  Space,
  message,
  Divider,
  Typography,
  Tag,
  Select
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload';
import { courseService } from '@/services/courseService';
import { CourseStatus } from '@/types/course';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Option } = Select;

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

interface ImportExportProps {
  onImportSuccess?: () => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ onImportSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await courseService.exportCourses(exportFormat);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `courses.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`Courses exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export courses');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'excel') => {
    try {
      const blob = await courseService.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `course-template.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`Template downloaded successfully as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.xlsx,.xls',
    beforeUpload: (file) => {
      const isValidFormat = file.type === 'text/csv' ||
                           file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                           file.type === 'application/vnd.ms-excel';

      if (!isValidFormat) {
        message.error('You can only upload CSV or Excel files!');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      return false; // Prevent automatic upload
    },
    onChange: (info) => {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await courseService.importCourses(formData);

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);

      if (result.failed === 0) {
        message.success(`Successfully imported ${result.success} courses`);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        message.warning(`Imported ${result.success} courses, ${result.failed} failed`);
      }
    } catch (error) {
      message.error('Failed to import courses');
      setImportResult({
        success: 0,
        failed: 1,
        errors: [{
          row: 0,
          field: 'general',
          message: 'Failed to process file',
          data: null
        }]
      });
    } finally {
      setUploading(false);
    }
  };

  const errorColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: 120,
    },
    {
      title: 'Error',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  return (
    <div>
      {/* Export Section */}
      <Card title="Export Courses" size="small" className="mb-4">
        <Row gutter={16} className="mb-3">
          <Col span={8}>
            <Text>Export Format:</Text>
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exportLoading}
              style={{ marginTop: 24 }}
            >
              Export All Courses
            </Button>
          </Col>
        </Row>

        <Alert
          message="Export Info"
          description="Export will download all courses with their current data including schedules and prerequisites."
          type="info"
          showIcon
        />
      </Card>

      <Divider />

      {/* Import Section */}
      <Card title="Import Courses" size="small">
        {/* Templates */}
        <div className="mb-4">
          <Title level={5}>Download Template</Title>
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleDownloadTemplate('excel')}
            >
              Excel Template
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => handleDownloadTemplate('csv')}
            >
              CSV Template
            </Button>
          </Space>
          <Text type="secondary" className="d-block mt-2">
            Use these templates to ensure your data format is correct
          </Text>
        </div>

        <Divider />

        {/* File Upload */}
        <Title level={5}>Upload File</Title>
        <Dragger
          {...uploadProps}
          customRequest={({ file }) => {
            if (file) {
              handleFileUpload(file as File);
            }
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for CSV and Excel files. Maximum file size: 10MB.
          </p>
        </Dragger>

        {/* Progress */}
        {uploading && (
          <div className="mt-3">
            <Text>Importing courses...</Text>
            <Progress percent={importProgress} />
          </div>
        )}

        {/* Results */}
        {importResult && (
          <div className="mt-4">
            <Row gutter={16} className="mb-3">
              <Col span={12}>
                <Card size="small">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Successful Imports:</Text>
                    <Tag color="green">{importResult.success}</Tag>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                    <Text strong>Failed Imports:</Text>
                    <Tag color="red">{importResult.failed}</Tag>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <Card title="Import Errors" size="small">
                <Table
                  dataSource={importResult.errors}
                  columns={errorColumns}
                  pagination={false}
                  size="small"
                  rowKey="row"
                />
              </Card>
            )}
          </div>
        )}

        {/* Import Guidelines */}
        <Alert
          message="Import Guidelines"
          description={
            <ul>
              <li>Course codes must be unique and follow the format (e.g., CS101)</li>
              <li>Required fields: code, name, description, credits, teacher, capacity</li>
              <li>Status values: DRAFT, PUBLISHED, CANCELLED, COMPLETED</li>
              <li>Prerequisites should be course codes of existing courses</li>
              <li>Multiple schedules can be defined with days, times, and locations</li>
            </ul>
          }
          type="info"
          showIcon
          className="mt-4"
        />
      </Card>
    </div>
  );
};

export default ImportExport;