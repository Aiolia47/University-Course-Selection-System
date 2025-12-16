import React from 'react';
import { Card, Descriptions, Tag, Typography, Divider } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Course, CourseStatus } from '@/types/course';
import styles from './CourseDetail.module.css';

const { Paragraph, Text } = Typography;

interface CourseInfoProps {
  course: Course;
  showFullInfo?: boolean;
}

const CourseInfo: React.FC<CourseInfoProps> = ({ course, showFullInfo = true }) => {
  // Get assessment methods based on course data
  const getAssessmentMethods = () => {
    // This would typically come from the course data
    // For now, we'll use default values
    return [
      { name: '平时成绩', percentage: 30 },
      { name: '期中考试', percentage: 30 },
      { name: '期末考试', percentage: 40 }
    ];
  };

  // Get course requirements
  const getCourseRequirements = () => {
    const requirements = [];

    if (course.credits >= 4) {
      requirements.push('需要较多课外学习时间');
    }

    if (course.prerequisites && course.prerequisites.length > 0) {
      requirements.push(`需先修${course.prerequisites.length}门课程`);
    }

    return requirements.length > 0 ? requirements : ['无特殊要求'];
  };

  // Format schedule days
  const formatScheduleDays = () => {
    if (!course.schedules || course.schedules.length === 0) {
      return '待定';
    }

    const dayMap: { [key: string]: string } = {
      monday: '周一',
      tuesday: '周二',
      wednesday: '周三',
      thursday: '周四',
      friday: '周五',
      saturday: '周六',
      sunday: '周日'
    };

    const allDays = new Set<string>();
    course.schedules.forEach(schedule => {
      schedule.dayOfWeek.forEach(day => {
        allDays.add(dayMap[day] || day);
      });
    });

    return Array.from(allDays).join('、');
  };

  // Get course difficulty based on credits and prerequisites
  const getDifficulty = () => {
    if (course.credits >= 4) return { level: '高', color: 'red' };
    if (course.credits >= 3) return { level: '中', color: 'orange' };
    return { level: '低', color: 'green' };
  };

  const difficulty = getDifficulty();

  return (
    <Card
      title={
        <div className={styles.cardTitle}>
          <BookOutlined /> 课程信息
        </div>
      }
      className={styles.infoCard}
    >
      <Descriptions column={{ xs: 1, sm: 2, md: 2 }}>
        <Descriptions.Item label="课程代码">
          <Tag color="blue">{course.code}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="学分">
          <Tag color="green">{course.credits} 学分</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="授课教师">
          <span className={styles.teacherName}>
            <UserOutlined /> {course.teacher}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="课程状态">
          <Tag color={course.status === CourseStatus.PUBLISHED ? 'green' : 'orange'}>
            {course.status === CourseStatus.PUBLISHED ? '已发布' : '草稿'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="上课时间">
          <Text>{formatScheduleDays()}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="课程难度">
          <Tag color={difficulty.color}>难度：{difficulty.level}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="选课人数" span={2}>
          <Text>
            <TeamOutlined /> {course.enrolled} / {course.capacity}
            <span className={styles.enrollmentRate}>
              (选课率：{Math.round((course.enrolled / course.capacity) * 100)}%)
            </span>
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Course Description */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <FileTextOutlined /> 课程描述
        </h4>
        <Paragraph className={styles.description}>
          {course.description || '暂无课程描述'}
        </Paragraph>
      </div>

      {showFullInfo && (
        <>
          {/* Assessment Methods */}
          <Divider />
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <TrophyOutlined /> 考核方式
            </h4>
            <div className={styles.assessmentMethods}>
              {getAssessmentMethods().map((method, index) => (
                <div key={index} className={styles.assessmentItem}>
                  <span className={styles.assessmentName}>{method.name}</span>
                  <Tag color="blue">{method.percentage}%</Tag>
                </div>
              ))}
            </div>
          </div>

          {/* Course Requirements */}
          <Divider />
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <CalendarOutlined /> 选课要求
            </h4>
            <ul className={styles.requirements}>
              {getCourseRequirements().map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <>
              <Divider />
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                  <BookOutlined /> 先修课程
                </h4>
                <div className={styles.prerequisites}>
                  {course.prerequisites.map((prereq, index) => (
                    <Tag key={index} color="orange" className={styles.prereqTag}>
                      {prereq.courseCode} - {prereq.courseName}
                      {prereq.minimumGrade && (
                        <span className={styles.minGrade}>
                          (最低分: {prereq.minimumGrade})
                        </span>
                      )}
                    </Tag>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default CourseInfo;