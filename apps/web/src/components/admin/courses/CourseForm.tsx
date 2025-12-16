import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Card,
  Space,
  Divider,
  TimePicker,
  message,
  Switch
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import { Course, CourseStatus, CourseSchedule, DayOfWeek } from '@/types/course';
import { formatDateTime } from '@/utils/date';

const { TextArea } = Input;
const { Option } = Select;

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  credits: number;
  teacher: string;
  capacity: number;
  status: CourseStatus;
  schedules: CourseSchedule[];
  prerequisites: string[];
}

const DAYS_OF_WEEK = [
  { label: 'Monday', value: DayOfWeek.MONDAY },
  { label: 'Tuesday', value: DayOfWeek.TUESDAY },
  { label: 'Wednesday', value: DayOfWeek.WEDNESDAY },
  { label: 'Thursday', value: DayOfWeek.THURSDAY },
  { label: 'Friday', value: DayOfWeek.FRIDAY },
  { label: 'Saturday', value: DayOfWeek.SATURDAY },
  { label: 'Sunday', value: DayOfWeek.SUNDAY }
];

const STATUS_OPTIONS = [
  { label: 'Draft', value: CourseStatus.DRAFT },
  { label: 'Published', value: CourseStatus.PUBLISHED },
  { label: 'Cancelled', value: CourseStatus.CANCELLED },
  { label: 'Completed', value: CourseStatus.COMPLETED }
];

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (course) {
      const formData: FormData = {
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        teacher: course.teacher,
        capacity: course.capacity,
        status: course.status,
        schedules: course.schedules || [],
        prerequisites: course.prerequisites?.map(p => p.prerequisiteCourseId) || []
      };

      form.setFieldsValue(formData);
      setIsPublished(course.status === CourseStatus.PUBLISHED);
    } else {
      // Reset form for new course
      form.resetFields();
      setIsPublished(false);
    }
  }, [course, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Format the data
      const formattedData = {
        ...values,
        schedules: values.schedules?.map((schedule: any) => ({
          ...schedule,
          dayOfWeek: schedule.dayOfWeek || [],
          startTime: schedule.startTime?.format('HH:mm'),
          endTime: schedule.endTime?.format('HH:mm'),
          weeks: schedule.weeks || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        })) || []
      };

      onSubmit(formattedData);
    } catch (error) {
      message.error('Please fix the validation errors');
    }
  };

  const handleStatusChange = (status: CourseStatus) => {
    setIsPublished(status === CourseStatus.PUBLISHED);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={{
        status: CourseStatus.DRAFT,
        credits: 3,
        capacity: 30,
        schedules: [{
          dayOfWeek: [],
          startTime: null,
          endTime: null,
          location: '',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        }],
        prerequisites: []
      }}
    >
      {/* Basic Information */}
      <Card title="Basic Information" size="small" className="mb-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Course Code"
              rules={[
                { required: true, message: 'Please enter course code' },
                { pattern: /^[A-Z]{2,4}\d{3,4}$/, message: 'Code format should be like CS101 or MATH2001' }
              ]}
            >
              <Input placeholder="e.g., CS101" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select onChange={handleStatusChange}>
                {STATUS_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="name"
          label="Course Name"
          rules={[
            { required: true, message: 'Please enter course name' },
            { max: 100, message: 'Course name cannot exceed 100 characters' }
          ]}
        >
          <Input placeholder="e.g., Introduction to Computer Science" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter course description' }]}
        >
          <TextArea
            rows={4}
            placeholder="Provide a detailed description of the course..."
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="credits"
              label="Credits"
              rules={[
                { required: true, message: 'Please enter credits' },
                { type: 'number', min: 1, max: 10, message: 'Credits must be between 1 and 10' }
              ]}
            >
              <InputNumber
                min={1}
                max={10}
                placeholder="3"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="teacher"
              label="Teacher"
              rules={[
                { required: true, message: 'Please enter teacher name' },
                { max: 50, message: 'Teacher name cannot exceed 50 characters' }
              ]}
            >
              <Input placeholder="e.g., Dr. John Smith" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="capacity"
              label="Capacity"
              rules={[
                { required: true, message: 'Please enter course capacity' },
                { type: 'number', min: 1, max: 1000, message: 'Capacity must be between 1 and 1000' }
              ]}
            >
              <InputNumber
                min={1}
                max={1000}
                placeholder="30"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Schedule Information */}
      <Card title="Schedule Information" size="small" className="mb-4">
        <Form.List name="schedules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  title={`Schedule ${name + 1}`}
                  extra={
                    fields.length > 1 ? (
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    ) : null
                  }
                  className="mb-3"
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'dayOfWeek']}
                        label="Days of Week"
                        rules={[{ required: true, message: 'Please select days' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select days"
                          options={DAYS_OF_WEEK}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'startTime']}
                        label="Start Time"
                        rules={[{ required: true, message: 'Please select start time' }]}
                      >
                        <Input.TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'endTime']}
                        label="End Time"
                        rules={[{ required: true, message: 'Please select end time' }]}
                      >
                        <Input.TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'location']}
                        label="Location"
                        rules={[{ required: true, message: 'Please enter location' }]}
                      >
                        <Input placeholder="e.g., Room 301, Building A" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'weeks']}
                        label="Weeks"
                        rules={[{ required: true, message: 'Please select weeks' }]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select weeks"
                          options={Array.from({ length: 16 }, (_, i) => ({
                            label: `Week ${i + 1}`,
                            value: i + 1
                          }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                className="mt-2"
              >
                Add Schedule
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Prerequisites */}
      <Card title="Prerequisites" size="small" className="mb-4">
        <Form.List name="prerequisites">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} className="mb-2">
                  <Col span={20}>
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: 'Please enter prerequisite course code' }]}
                    >
                      <Input placeholder="e.g., CS101" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Button
                      type="link"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add Prerequisite
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* Form Actions */}
      <Divider />
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            {course ? 'Update Course' : 'Create Course'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default CourseForm;