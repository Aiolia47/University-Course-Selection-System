import React from 'react';
import { Form, Select, InputNumber, Button, Space, Divider, Typography } from 'antd';
import { ClearOutlined, CheckOutlined } from '@ant-design/icons';
import { CourseFilters, CourseStatus, DayOfWeek } from '@/types/course';

const { Title, Text } = Typography;
const { Option } = Select;

interface FilterPanelProps {
  filters: CourseFilters;
  onFilter: (filters: CourseFilters) => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilter, onClear }) => {
  const [form] = Form.useForm();

  const statusOptions = [
    { value: CourseStatus.PUBLISHED, label: '已发布' },
    { value: CourseStatus.DRAFT, label: '草稿' },
    { value: CourseStatus.CANCELLED, label: '已取消' },
    { value: CourseStatus.COMPLETED, label: '已完成' }
  ];

  const dayOfWeekOptions = [
    { value: DayOfWeek.MONDAY, label: '周一' },
    { value: DayOfWeek.TUESDAY, label: '周二' },
    { value: DayOfWeek.WEDNESDAY, label: '周三' },
    { value: DayOfWeek.THURSDAY, label: '周四' },
    { value: DayOfWeek.FRIDAY, label: '周五' },
    { value: DayOfWeek.SATURDAY, label: '周六' },
    { value: DayOfWeek.SUNDAY, label: '周日' }
  ];

  const handleApplyFilters = () => {
    const values = form.getFieldsValue();

    // Filter out empty values
    const cleanedFilters: CourseFilters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as CourseFilters);

    onFilter(cleanedFilters);
  };

  const handleReset = () => {
    form.resetFields();
    onClear();
  };

  return (
    <div className="filter-panel">
      <Form
        form={form}
        layout="vertical"
        initialValues={filters}
        onFinish={handleApplyFilters}
      >
        <Title level={4}>课程状态</Title>
        <Form.Item name="status">
          <Select
            placeholder="选择课程状态"
            allowClear
            style={{ width: '100%' }}
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Title level={4}>教师</Title>
        <Form.Item name="teacher">
          <Select
            placeholder="选择教师"
            allowClear
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          >
            {/* This would be populated from API */}
            <Option value="张教授">张教授</Option>
            <Option value="李教授">李教授</Option>
            <Option value="王教授">王教授</Option>
          </Select>
        </Form.Item>

        <Divider />

        <Title level={4}>学分范围</Title>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="minCredits" noStyle>
            <InputNumber
              placeholder="最小学分"
              min={0}
              max={10}
              style={{ width: '50%' }}
            />
          </Form.Item>
          <Form.Item name="maxCredits" noStyle>
            <InputNumber
              placeholder="最大学分"
              min={0}
              max={10}
              style={{ width: '50%' }}
            />
          </Form.Item>
        </Space.Compact>

        <Divider />

        <Title level={4}>上课时间</Title>
        <Form.Item name="dayOfWeek">
          <Select
            placeholder="选择星期"
            allowClear
            style={{ width: '100%' }}
          >
            {dayOfWeekOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="startTime" noStyle>
            <Select
              placeholder="开始时间"
              allowClear
              style={{ width: '50%' }}
            >
              <Option value="08:00">08:00</Option>
              <Option value="09:00">09:00</Option>
              <Option value="10:00">10:00</Option>
              <Option value="11:00">11:00</Option>
              <Option value="14:00">14:00</Option>
              <Option value="15:00">15:00</Option>
              <Option value="16:00">16:00</Option>
              <Option value="17:00">17:00</Option>
              <Option value="19:00">19:00</Option>
              <Option value="20:00">20:00</Option>
            </Select>
          </Form.Item>
          <Form.Item name="endTime" noStyle>
            <Select
              placeholder="结束时间"
              allowClear
              style={{ width: '50%' }}
            >
              <Option value="09:00">09:00</Option>
              <Option value="10:00">10:00</Option>
              <Option value="11:00">11:00</Option>
              <Option value="12:00">12:00</Option>
              <Option value="15:00">15:00</Option>
              <Option value="16:00">16:00</Option>
              <Option value="17:00">17:00</Option>
              <Option value="18:00">18:00</Option>
              <Option value="20:00">20:00</Option>
              <Option value="21:00">21:00</Option>
            </Select>
          </Form.Item>
        </Space.Compact>

        <Divider />

        <Title level={4}>地点</Title>
        <Form.Item name="location">
          <Select
            placeholder="选择校区/教学楼"
            allowClear
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          >
            <Option value="主校区">主校区</Option>
            <Option value="分校区">分校区</Option>
            <Option value="教学楼A">教学楼A</Option>
            <Option value="教学楼B">教学楼B</Option>
            <Option value="实验楼">实验楼</Option>
          </Select>
        </Form.Item>

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            icon={<ClearOutlined />}
            onClick={handleReset}
            style={{ width: '48%' }}
          >
            重置
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApplyFilters}
            style={{ width: '48%' }}
          >
            应用筛选
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default FilterPanel;