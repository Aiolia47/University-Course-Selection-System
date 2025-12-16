import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Spin, Empty, Avatar, Space } from 'antd';
import {
  BookOutlined,
  RightOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Course, CourseStatus } from '@/types/course';
import { courseService } from '@/services/courseService';
import styles from './CourseDetail.module.css';

interface RelatedCoursesProps {
  courseId: string;
}

const RelatedCourses: React.FC<RelatedCoursesProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load related courses
  const loadRelatedCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real application, this would call an API for related courses
      // For now, we'll get popular courses as a fallback
      const result = await courseService.getPopularCourses(5);

      // Filter out the current course
      const filtered = result.data.filter(course => course.id !== courseId);
      setRelatedCourses(filtered);
    } catch (err: any) {
      setError(err.message || '加载相关课程失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelatedCourses();
  }, [courseId]);

  // Navigate to course detail
  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  // Get status tag color
  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED:
        return 'green';
      case CourseStatus.DRAFT:
        return 'orange';
      case CourseStatus.CANCELLED:
        return 'red';
      case CourseStatus.COMPLETED:
        return 'blue';
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PUBLISHED:
        return '已发布';
      case CourseStatus.DRAFT:
        return '草稿';
      case CourseStatus.CANCELLED:
        return '已取消';
      case CourseStatus.COMPLETED:
        return '已完成';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <BookOutlined /> 相关课程推荐
          </div>
        }
        className={styles.relatedCoursesCard}
      >
        <div className={styles.loadingContainer}>
          <Spin size="small" tip="加载中..." />
        </div>
      </Card>
    );
  }

  if (error || relatedCourses.length === 0) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <BookOutlined /> 相关课程推荐
          </div>
        }
        className={styles.relatedCoursesCard}
      >
        <Empty
          description="暂无相关课程推荐"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className={styles.cardTitle}>
          <BookOutlined /> 相关课程推荐
        </div>
      }
      className={styles.relatedCoursesCard}
    >
      <List
        itemLayout="horizontal"
        dataSource={relatedCourses}
        renderItem={(course) => (
          <List.Item
            className={styles.relatedCourseItem}
            onClick={() => handleCourseClick(course.id)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  icon={<BookOutlined />}
                  className={styles.courseAvatar}
                >
                  {course.code.substring(0, 2)}
                </Avatar>
              }
              title={
                <div className={styles.relatedCourseTitle}>
                  <span className={styles.courseName}>{course.name}</span>
                  <Space size="small" className={styles.courseMeta}>
                    <Tag color="blue" size="small">{course.code}</Tag>
                    <Tag color={getStatusColor(course.status)} size="small">
                      {getStatusText(course.status)}
                    </Tag>
                    {course.credits && (
                      <Tag color="green" size="small">{course.credits}学分</Tag>
                    )}
                  </Space>
                </div>
              }
              description={
                <div className={styles.relatedCourseDescription}>
                  <p className={styles.courseDescription}>
                    {course.description
                      ? course.description.length > 60
                        ? `${course.description.substring(0, 60)}...`
                        : course.description
                      : '暂无描述'}
                  </p>
                  <div className={styles.courseStats}>
                    <Space size="middle" split={<span>|</span>}>
                      <span className={styles.statItem}>
                        <TeamOutlined /> {course.enrolled}/{course.capacity}
                      </span>
                      <span className={styles.statItem}>
                        {course.teacher}
                      </span>
                      {course.schedules && course.schedules.length > 0 && (
                        <span className={styles.statItem}>
                          <ClockCircleOutlined />
                          {course.schedules[0].startTime}
                        </span>
                      )}
                    </Space>
                  </div>
                </div>
              }
            />
            <Button
              type="link"
              icon={<RightOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCourseClick(course.id);
              }}
            >
              查看
            </Button>
          </List.Item>
        )}
      />

      {/* View All Courses Button */}
      <div className={styles.relatedCoursesFooter}>
        <Button
          type="default"
          icon={<BookOutlined />}
          onClick={() => navigate('/courses')}
          block
        >
          查看所有课程
        </Button>
      </div>
    </Card>
  );
};

export default RelatedCourses;