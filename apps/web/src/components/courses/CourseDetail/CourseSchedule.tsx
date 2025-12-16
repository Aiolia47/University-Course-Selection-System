import React from 'react';
import { Card, Table, Tag, Empty } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { CourseSchedule, DayOfWeek } from '@/types/course';
import styles from './CourseDetail.module.css';

interface CourseScheduleProps {
  schedules: CourseSchedule[];
}

const CourseSchedule: React.FC<CourseScheduleProps> = ({ schedules }) => {
  // Map day enums to Chinese
  const dayMap: { [key in DayOfWeek]: string } = {
    [DayOfWeek.MONDAY]: '周一',
    [DayOfWeek.TUESDAY]: '周二',
    [DayOfWeek.WEDNESDAY]: '周三',
    [DayOfWeek.THURSDAY]: '周四',
    [DayOfWeek.FRIDAY]: '周五',
    [DayOfWeek.SATURDAY]: '周六',
    [DayOfWeek.SUNDAY]: '周日'
  };

  // Format schedule data for table display
  const formatSchedulesForTable = () => {
    if (!schedules || schedules.length === 0) {
      return [];
    }

    return schedules.map((schedule, index) => {
      const days = schedule.dayOfWeek.map(day => dayMap[day]).join('、');
      const weeks = schedule.weeks.length > 0
        ? `${Math.min(...schedule.weeks)}-${Math.max(...schedule.weeks)}周`
        : '待定';

      return {
        key: index,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        days,
        location: schedule.location,
        weeks,
        rawSchedule: schedule
      };
    });
  };

  // Get table columns
  const columns = [
    {
      title: '上课时间',
      dataIndex: 'time',
      key: 'time',
      render: (time: string) => (
        <span className={styles.scheduleTime}>
          <ClockCircleOutlined /> {time}
        </span>
      )
    },
    {
      title: '星期',
      dataIndex: 'days',
      key: 'days',
      render: (days: string) => (
        <Tag color="blue">{days}</Tag>
      )
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => (
        <span className={styles.scheduleLocation}>
          <EnvironmentOutlined /> {location || '待定'}
        </span>
      )
    },
    {
      title: '周次',
      dataIndex: 'weeks',
      key: 'weeks',
      render: (weeks: string) => (
        <span className={styles.scheduleWeeks}>
          <CalendarOutlined /> {weeks}
        </span>
      )
    }
  ];

  const scheduleData = formatSchedulesForTable();

  if (!scheduleData || scheduleData.length === 0) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <ClockCircleOutlined /> 课程安排
          </div>
        }
        className={styles.scheduleCard}
      >
        <Empty
          description="暂无课程安排"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className={styles.cardTitle}>
          <ClockCircleOutlined /> 课程安排
        </div>
      }
      className={styles.scheduleCard}
    >
      <Table
        columns={columns}
        dataSource={scheduleData}
        pagination={false}
        size="middle"
        className={styles.scheduleTable}
      />

      {/* Additional Schedule Information */}
      <div className={styles.scheduleInfo}>
        <div className={styles.infoItem}>
          <strong>注意：</strong>请提前查看教室安排，如有变动会及时通知
        </div>
      </div>
    </Card>
  );
};

export default CourseSchedule;