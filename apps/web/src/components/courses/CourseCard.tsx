import React from 'react';
import { Card, Tag, Avatar, Button, Space, Tooltip, Typography } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HeartFilled,
  CompareArrowsOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { CourseCardProps } from '@/types/course';
import './CourseCard.css';

const { Text, Paragraph } = Typography;

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onSelect,
  onViewDetails,
  onFavorite,
  isFavorite = false,
  compareMode = false,
  onCompare,
  isInCompareList = false
}) => {
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

    return `${days} ${schedule.startTime}-${schedule.endTime}`;
  };

  const enrollmentRate = course.capacity > 0 ? (course.enrolled / course.capacity) * 100 : 0;
  const isAlmostFull = enrollmentRate >= 90;
  const isFull = course.enrolled >= course.capacity;

  return (
    <Card
      hoverable
      className={`course-card ${isFull ? 'course-card-full' : ''} ${isAlmostFull ? 'course-card-almost-full' : ''}`}
      cover={
        <div className="course-card-cover">
          <Avatar
            size={64}
            icon={<BookOutlined />}
            className="course-card-avatar"
          />
          <Tag color={getStatusColor(course.status)} className="course-card-status">
            {getStatusText(course.status)}
          </Tag>
        </div>
      }
      actions={[
        <Tooltip title="查看详情">
          <EyeOutlined key="details" onClick={() => onViewDetails?.(course.id)} />
        </Tooltip>,
        ...(onFavorite ? [
          <Tooltip title={isFavorite ? '取消收藏' : '收藏课程'}>
            {isFavorite ? (
              <HeartFilled key="favorite" style={{ color: '#ff4d4f' }} onClick={() => onFavorite(course.id)} />
            ) : (
              <HeartOutlined key="favorite" onClick={() => onFavorite(course.id)} />
            )}
          </Tooltip>
        ] : []),
        ...(compareMode && onCompare ? [
          <Tooltip title={isInCompareList ? '从对比列表移除' : '加入对比'}>
            <CompareArrowsOutlined
              key="compare"
              style={{ color: isInCompareList ? '#1890ff' : undefined }}
              onClick={() => onCompare(course.id)}
            />
          </Tooltip>
        ] : [])
      ].filter(Boolean)}
    >
      <Card.Meta
        title={
          <div className="course-card-title">
            <Text strong>{course.name}</Text>
            <Text type="secondary" className="course-card-code">({course.code})</Text>
          </div>
        }
        description={
          <div className="course-card-content">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="course-card-teacher">
                <UserOutlined /> <Text>{course.teacher}</Text>
              </div>

              <div className="course-card-info">
                <Space split={<span>•</span>}>
                  <span><BookOutlined /> {course.credits} 学分</span>
                  <span className={isFull ? 'enrollment-full' : isAlmostFull ? 'enrollment-almost-full' : ''}>
                    {course.enrolled}/{course.capacity} 人
                  </span>
                </Space>
              </div>

              {course.schedules.length > 0 && (
                <div className="course-card-schedule">
                  <ClockCircleOutlined /> {formatSchedule(course.schedules[0])}
                </div>
              )}

              {course.schedules[0]?.location && (
                <div className="course-card-location">
                  <EnvironmentOutlined /> {course.schedules[0].location}
                </div>
              )}

              <Paragraph
                ellipsis={{ rows: 2, expandable: false }}
                className="course-card-description"
              >
                {course.description}
              </Paragraph>
            </Space>
          </div>
        }
      />
    </Card>
  );
};

export default CourseCard;