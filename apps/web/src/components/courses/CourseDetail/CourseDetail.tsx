import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Descriptions,
  Divider,
  Spin,
  Alert,
  Breadcrumb,
  message,
  Modal,
  Space,
  Typography,
  Tooltip,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import { Course, CourseStatus } from '@/types/course';
import { courseService } from '@/services/courseService';
import { selectionService, SelectionStatus } from '@/services/selectionService';
import CourseInfo from './CourseInfo';
import CourseSchedule from './CourseSchedule';
import TeacherInfo from './TeacherInfo';
import CourseEvaluation from './CourseEvaluation';
import RelatedCourses from './RelatedCourses';
import SelectionButton from './SelectionButton';
import styles from './CourseDetail.module.css';

const { Title, Paragraph } = Typography;

interface CourseDetailProps {
  courseId?: string;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId: propCourseId }) => {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const courseId = propCourseId || paramCourseId;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load course data
  const loadCourse = async () => {
    if (!courseId) {
      setError('课程ID不能为空');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);

      // Track course view
      await courseService.trackCourseView(courseId);
    } catch (err: any) {
      setError(err.message || '加载课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!course) return;

    try {
      // TODO: Implement favorite service
      setIsFavorite(!isFavorite);
      message.success(isFavorite ? '已取消收藏' : '已添加到收藏');
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  // Handle share
  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
      setShowShareModal(false);
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!courseId) return;

    setIsRefreshing(true);
    try {
      // Use refresh method to bypass cache
      const refreshedCourse = await courseService.refreshCourse(courseId);
      setCourse(refreshedCourse);
      message.success('数据已更新');
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setIsRefreshing(false);
    }
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
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="加载课程详情中..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="加载失败"
          description={error || '课程不存在'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadCourse}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  const enrollmentRate = Math.round((course.enrolled / course.capacity) * 100);
  const isFull = course.enrolled >= course.capacity;
  const isSelectable = course.status === CourseStatus.PUBLISHED && !isFull;

  // Generate meta description
  const generateMetaDescription = () => {
    if (!course) return '';

    const description = course.description
      ? course.description.length > 160
        ? `${course.description.substring(0, 160)}...`
        : course.description
      : `${course.name} - ${course.credits}学分课程，授课教师：${course.teacher}`;

    return description;
  };

  return (
    <>
      <Helmet>
        <title>{course ? `${course.name} (${course.code}) - 课程详情` : '课程详情'}</title>
        <meta name="description" content={generateMetaDescription()} />
        <meta name="keywords" content={
          course
            ? `${course.name},${course.code},${course.teacher},课程,选课,${course.credits}学分`
            : '课程详情,选课系统'
        } />

        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content={course ? `${course.name} (${course.code})` : '课程详情'} />
        <meta property="og:description" content={generateMetaDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={course ? `${course.name} (${course.code})` : '课程详情'} />
        <meta name="twitter:description" content={generateMetaDescription()} />

        {/* Additional meta tags */}
        <meta name="author" content={course?.teacher} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="robots" content="index, follow" />

        {/* Structured data for search engines */}
        {course && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              "name": course.name,
              "description": course.description,
              "courseCode": course.code,
              "provider": {
                "@type": "Organization",
                "name": "University"
              },
              "instructor": {
                "@type": "Person",
                "name": course.teacher
              },
              "educationalLevel": "Undergraduate",
              "credits": course.credits,
              "about": course.description,
              "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "onsite",
                "instructor": {
                  "@type": "Person",
                  "name": course.teacher
                }
              }
            })}
          </script>
        )}
      </Helmet>

      <div className={styles.courseDetail}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.Item>
          <a href="/courses">课程列表</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{course.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header Actions */}
      <div className={styles.headerActions}>
        <Space>
          <Tooltip title="返回">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            />
          </Tooltip>
          <Tooltip title="刷新">
            <Button
              icon={<ClockCircleOutlined />}
              onClick={handleRefresh}
              loading={isRefreshing}
            />
          </Tooltip>
          <Tooltip title="收藏">
            <Button
              icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleFavoriteToggle}
              type={isFavorite ? 'primary' : 'default'}
            />
          </Tooltip>
          <Tooltip title="分享">
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShare}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Course Header */}
      <Card className={styles.courseHeader}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={18}>
            <div className={styles.courseTitle}>
              <Space align="start" direction="vertical" size="small">
                <Title level={2} className={styles.title}>
                  {course.name}
                </Title>
                <Space size="middle">
                  <Tag color={getStatusColor(course.status)}>
                    {getStatusText(course.status)}
                  </Tag>
                  <span className={styles.courseCode}>
                    <BookOutlined /> {course.code}
                  </span>
                  <span className={styles.credits}>
                    {course.credits} 学分
                  </span>
                </Space>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div className={styles.selectionSection}>
              <SelectionButton
                courseId={course.id}
                isSelectable={isSelectable}
                isFull={isFull}
                enrolled={course.enrolled}
                capacity={course.capacity}
                onSelectionChange={() => loadCourse()}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={[24, 16]} className={styles.courseStats}>
          <Col xs={8} sm={6} md={4}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{course.credits}</div>
              <div className={styles.statLabel}>学分</div>
            </div>
          </Col>
          <Col xs={8} sm={6} md={4}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{course.capacity}</div>
              <div className={styles.statLabel}>总名额</div>
            </div>
          </Col>
          <Col xs={8} sm={6} md={4}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{course.enrolled}</div>
              <div className={styles.statLabel}>已选</div>
            </div>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                <Badge
                  count={enrollmentRate}
                  style={{
                    backgroundColor: enrollmentRate >= 90 ? 'red' : enrollmentRate >= 70 ? 'orange' : 'green'
                  }}
                />
              </div>
              <div className={styles.statLabel}>选课率</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Course Content */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Course Info */}
          <CourseInfo course={course} />

          {/* Course Schedule */}
          <CourseSchedule schedules={course.schedules} />

          {/* Course Evaluation */}
          <CourseEvaluation courseId={course.id} />
        </Col>

        <Col xs={24} lg={8}>
          {/* Teacher Info */}
          <TeacherInfo teacher={course.teacher} courseId={course.id} />

          {/* Related Courses */}
          <RelatedCourses courseId={course.id} />
        </Col>
      </Row>

      {/* Share Modal */}
      <Modal
        title="分享课程"
        open={showShareModal}
        onCancel={() => setShowShareModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowShareModal(false)}>
            取消
          </Button>,
          <Button key="copy" type="primary" onClick={copyShareLink}>
            复制链接
          </Button>
        ]}
      >
        <Paragraph>
          将课程链接分享给朋友：
        </Paragraph>
        <div className={styles.shareLink}>
          {window.location.href}
        </div>
      </Modal>
      </div>
    </>
  );
};

export default CourseDetail;