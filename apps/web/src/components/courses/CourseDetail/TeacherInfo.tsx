import React, { useState, useEffect } from 'react';
import { Card, Avatar, Rate, Descriptions, Tag, Spin, Empty } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import styles from './CourseDetail.module.css';

interface TeacherInfoProps {
  teacher: string;
  courseId?: string;
}

interface TeacherInfo {
  name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  office?: string;
  avatar?: string;
  bio?: string;
  specializations?: string[];
  rating?: number;
  totalRatings?: number;
  coursesTaught?: number;
}

interface CourseEvaluation {
  teacherRating: number;
  teachingQuality: number;
  courseDifficulty: number;
  workload: number;
  grading: number;
  attendance: number;
  comments?: Array<{
    id: string;
    studentName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

const TeacherInfo: React.FC<TeacherInfoProps> = ({ teacher, courseId }) => {
  const [teacherData, setTeacherData] = useState<TeacherInfo | null>(null);
  const [evaluations, setEvaluations] = useState<CourseEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load teacher information
  const loadTeacherInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real application, this would call a teacher service
      // For now, we'll create mock data based on the teacher name
      const mockTeacherData: TeacherInfo = {
        name: teacher,
        title: '教授',
        department: '计算机科学与技术系',
        email: `${teacher.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
        phone: '123-4567-8900',
        office: '教学楼 A502',
        bio: `${teacher}是计算机科学领域的资深教授，拥有丰富的教学和研究经验。主要研究方向包括算法设计、数据结构和软件工程。`,
        specializations: ['算法与数据结构', '软件工程', '人工智能', '数据库系统'],
        rating: 4.5,
        totalRatings: 156,
        coursesTaught: 12
      };

      // Mock evaluation data
      const mockEvaluations: CourseEvaluation = {
        teacherRating: 4.5,
        teachingQuality: 4.6,
        courseDifficulty: 3.2,
        workload: 3.5,
        grading: 4.1,
        attendance: 4.3,
        comments: [
          {
            id: '1',
            studentName: '张三',
            rating: 5,
            comment: '老师讲课非常清晰，耐心解答问题，课程内容充实。',
            createdAt: '2024-12-01'
          },
          {
            id: '2',
            studentName: '李四',
            rating: 4,
            comment: '课程有一定挑战性，但老师的教学方法很好，能学到很多东西。',
            createdAt: '2024-11-15'
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setTeacherData(mockTeacherData);
      setEvaluations(mockEvaluations);
    } catch (err: any) {
      setError(err.message || '加载教师信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacher) {
      loadTeacherInfo();
    }
  }, [teacher]);

  if (loading) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <UserOutlined /> 教师信息
          </div>
        }
        className={styles.teacherCard}
      >
        <div className={styles.loadingContainer}>
          <Spin size="small" tip="加载中..." />
        </div>
      </Card>
    );
  }

  if (error || !teacherData) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <UserOutlined /> 教师信息
          </div>
        }
        className={styles.teacherCard}
      >
        <Empty
          description="暂无教师信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className={styles.cardTitle}>
          <UserOutlined /> 教师信息
        </div>
      }
      className={styles.teacherCard}
    >
      {/* Teacher Header */}
      <div className={styles.teacherHeader}>
        <Avatar
          size={64}
          src={teacherData.avatar}
          icon={<UserOutlined />}
          className={styles.teacherAvatar}
        />
        <div className={styles.teacherBasicInfo}>
          <h3 className={styles.teacherName}>{teacherData.name}</h3>
          <div className={styles.teacherTitle}>
            {teacherData.title} · {teacherData.department}
          </div>
          {teacherData.rating && (
            <div className={styles.teacherRating}>
              <Rate disabled value={teacherData.rating} allowHalf />
              <span className={styles.ratingText}>
                {teacherData.rating} ({teacherData.totalRatings}条评价)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Details */}
      <Descriptions column={1} size="small" className={styles.teacherDetails}>
        {teacherData.email && (
          <Descriptions.Item label="邮箱">
            <MailOutlined /> {teacherData.email}
          </Descriptions.Item>
        )}
        {teacherData.phone && (
          <Descriptions.Item label="电话">
            <PhoneOutlined /> {teacherData.phone}
          </Descriptions.Item>
        )}
        {teacherData.office && (
          <Descriptions.Item label="办公室">
            <EnvironmentOutlined /> {teacherData.office}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="授课数量">
          <BookOutlined /> {teacherData.coursesTaught}门课程
        </Descriptions.Item>
      </Descriptions>

      {/* Specializations */}
      {teacherData.specializations && teacherData.specializations.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>研究方向</h4>
          <div className={styles.specializations}>
            {teacherData.specializations.map((spec, index) => (
              <Tag key={index} color="blue" className={styles.specTag}>
                {spec}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {teacherData.bio && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>教师简介</h4>
          <p className={styles.teacherBio}>{teacherData.bio}</p>
        </div>
      )}

      {/* Teaching Evaluations */}
      {evaluations && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <TrophyOutlined /> 教学评价
          </h4>
          <div className={styles.evaluations}>
            <div className={styles.evaluationItem}>
              <span className={styles.evaluationLabel}>教学水平</span>
              <Rate disabled value={evaluations.teachingQuality} size="small" />
              <span className={styles.evaluationScore}>{evaluations.teachingQuality}</span>
            </div>
            <div className={styles.evaluationItem}>
              <span className={styles.evaluationLabel}>课程难度</span>
              <Rate disabled value={evaluations.courseDifficulty} size="small" />
              <span className={styles.evaluationScore}>{evaluations.courseDifficulty}</span>
            </div>
            <div className={styles.evaluationItem}>
              <span className={styles.evaluationLabel}>作业量</span>
              <Rate disabled value={evaluations.workload} size="small" />
              <span className={styles.evaluationScore}>{evaluations.workload}</span>
            </div>
            <div className={styles.evaluationItem}>
              <span className={styles.evaluationLabel}>评分公平</span>
              <Rate disabled value={evaluations.grading} size="small" />
              <span className={styles.evaluationScore}>{evaluations.grading}</span>
            </div>
          </div>

          {/* Recent Comments */}
          {evaluations.comments && evaluations.comments.length > 0 && (
            <div className={styles.comments}>
              <h5 className={styles.commentsTitle}>最近评价</h5>
              {evaluations.comments.slice(0, 2).map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{comment.studentName}</span>
                    <Rate disabled value={comment.rating} size="small" />
                  </div>
                  <p className={styles.commentText}>{comment.comment}</p>
                  <span className={styles.commentDate}>{comment.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TeacherInfo;