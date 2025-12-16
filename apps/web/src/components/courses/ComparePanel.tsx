import React from 'react';
import { Card, Table, Tag, Button, Space, Typography, Empty, Spin } from 'antd';
import { DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/stores';
import { CourseStatus } from '@/types/course';

const { Title, Text } = Typography;

interface ComparePanelProps {
  courseIds: string[];
  onRemove: (courseId: string) => void;
  onClear: () => void;
}

const ComparePanel: React.FC<ComparePanelProps> = ({ courseIds, onRemove, onClear }) => {
  const { courses } = useSelector((state: RootState) => state.courses);

  const compareCourses = courses.filter(course => courseIds.includes(course.id));

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布';
      case 'draft':
        return '草稿';
      case 'cancelled':
        return '已取消';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'green';
      case 'draft':
        return 'orange';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'default';
    }
  };

  const formatSchedule = (schedule: any) => {
    const days = schedule.dayOfWeek.map((day: string) => {
      const dayMap: { [key: string]: string } = {
        monday: '周一',
        tuesday: '周二',
        wednesday: '周三',
        thursday: '周四',
        friday: '周五',
        saturday: '周六',
        sunday: '周日'
      };
      return dayMap[day] || day;
    }).join(', ');

    return `${days} ${schedule.startTime}-${schedule.endTime} @ ${schedule.location}`;
  };

  const getEnrollmentStatus = (enrolled: number, capacity: number) => {
    const rate = capacity > 0 ? (enrolled / capacity) * 100 : 0;
    if (rate >= 100) return { text: '已满', color: 'red' };
    if (rate >= 90) return { text: '即将满员', color: 'orange' };
    return { text: '充足', color: 'green' };
  };

  const columns = [
    {
      title: '对比项目',
      dataIndex: 'feature',
      key: 'feature',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>
    },
    ...compareCourses.map(course => ({
      title: (
        <div style={{ maxWidth: 150 }}>
          <div style={{ fontWeight: 'bold' }}>{course.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{course.code}</Text>
        </div>
      ),
      dataIndex: course.id,
      key: course.id,
      width: 150,
      render: (value: any, record: any) => {
        if (record.feature === '操作') {
          return (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onRemove(course.id)}
              danger
            >
              移除
            </Button>
          );
        }
        return value;
      }
    }))
  ];

  const dataSource = [
    {
      key: 'basic',
      feature: '基本信息',
      children: [
        {
          key: 'name',
          feature: '课程名称',
          ...compareCourses.reduce((acc, course) => {
            acc[course.id] = course.name;
            return acc;
          }, {})
        },
        {
          key: 'code',
          feature: '课程代码',
          ...compareCourses.reduce((acc, course) => {
            acc[course.id] = course.code;
            return acc;
          }, {})
        },
        {
          key: 'teacher',
          feature: '授课教师',
          ...compareCourses.reduce((acc, course) => {
            acc[course.id] = course.teacher;
            return acc;
          }, {})
        },
        {
          key: 'credits',
          feature: '学分',
          ...compareCourses.reduce((acc, course) => {
            acc[course.id] = `${course.credits} 学分`;
            return acc;
          }, {})
        }
      ]
    },
    {
      key: 'enrollment',
      feature: '选课情况',
      children: [
        {
          key: 'capacity',
          feature: '选课人数',
          ...compareCourses.reduce((acc, course) => {
            const status = getEnrollmentStatus(course.enrolled, course.capacity);
            acc[course.id] = (
              <div>
                <div>{course.enrolled}/{course.capacity}</div>
                <Tag color={status.color} size="small">{status.text}</Tag>
              </div>
            );
            return acc;
          }, {})
        }
      ]
    },
    {
      key: 'schedule',
      feature: '上课安排',
      ...compareCourses.reduce((acc, course) => {
        acc[course.id] = course.schedules.map((schedule, index) => (
          <div key={index} style={{ marginBottom: 4 }}>
            {formatSchedule(schedule)}
          </div>
        ));
        return acc;
      }, {})
    },
    {
      key: 'status',
      feature: '课程状态',
      ...compareCourses.reduce((acc, course) => {
        acc[course.id] = (
          <Tag color={getStatusColor(course.status)}>
            {getStatusText(course.status)}
          </Tag>
        );
        return acc;
      }, {})
    },
    {
      key: 'description',
      feature: '课程描述',
      ...compareCourses.reduce((acc, course) => {
        acc[course.id] = (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {course.description.length > 50
              ? `${course.description.substring(0, 50)}...`
              : course.description}
          </Text>
        );
        return acc;
      }, {})
    },
    {
      key: 'action',
      feature: '操作',
      ...compareCourses.reduce(() => ({}), {})
    }
  ];

  if (compareCourses.length === 0) {
    return (
      <Empty
        description="暂无对比课程"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="compare-panel">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          课程对比 ({compareCourses.length}/3)
        </Title>
        <Button
          icon={<ClearOutlined />}
          size="small"
          onClick={onClear}
          danger
        >
          清空对比
        </Button>
      </div>

      {compareCourses.length > 0 ? (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: true }}
          size="small"
          bordered
        />
      ) : (
        <Empty description="暂无对比数据" />
      )}
    </div>
  );
};

export default ComparePanel;