import React from 'react';
import { Card, Skeleton, Avatar } from 'antd';

const CourseCardSkeleton: React.FC = () => {
  return (
    <Card className="course-card-skeleton">
      <div className="course-card-skeleton-cover">
        <Skeleton.Avatar
          size={64}
          shape="circle"
          active
          className="course-card-skeleton-avatar"
        />
      </div>

      <Card.Meta
        avatar={null}
        title={
          <div>
            <Skeleton.Input active size="small" style={{ width: '60%', marginBottom: 8 }} />
            <Skeleton.Input active size="small" style={{ width: '30%' }} />
          </div>
        }
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton.Input active size="small" style={{ width: '40%' }} />

            <div style={{ display: 'flex', gap: 16 }}>
              <Skeleton.Input active size="small" style={{ width: '60px' }} />
              <Skeleton.Input active size="small" style={{ width: '80px' }} />
            </div>

            <Skeleton.Input active size="small" style={{ width: '70%' }} />

            <Skeleton.Input active size="small" style={{ width: '50%' }} />

            <div>
              <Skeleton.Input active size="small" style={{ width: '100%', height: 40 }} />
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default CourseCardSkeleton;