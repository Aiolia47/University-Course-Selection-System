import React from 'react';
import { Row, Col } from 'antd';
import CourseCardSkeleton from './CourseCardSkeleton';

interface CourseGridSkeletonProps {
  count?: number;
  rows?: number;
}

const CourseGridSkeleton: React.FC<CourseGridSkeletonProps> = ({ count = 12, rows }) => {
  const itemCount = rows ? rows * 4 : count; // Default 4 columns per row

  return (
    <Row gutter={[16, 16]} className="course-list-grid">
      {Array.from({ length: itemCount }).map((_, index) => (
        <Col
          key={index}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          xl={6}
        >
          <CourseCardSkeleton />
        </Col>
      ))}
    </Row>
  );
};

export default CourseGridSkeleton;