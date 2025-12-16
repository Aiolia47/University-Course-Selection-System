import React, { useState, useEffect } from 'react';
import { Card, Rate, Progress, Statistic, Row, Col, Avatar, List, Empty, Spin } from 'antd';
import {
  StarOutlined,
  CommentOutlined,
  TrophyOutlined,
  ThumbsUpOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import styles from './CourseDetail.module.css';

interface CourseEvaluationProps {
  courseId: string;
}

interface CourseEvaluation {
  overallRating: number;
  totalRatings: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categories: {
    courseContent: number;
    teachingQuality: number;
    courseDifficulty: number;
    workload: number;
    usefulness: number;
  };
  reviews: Array<{
    id: string;
    studentName: string;
    avatar?: string;
    rating: number;
    comment: string;
    pros?: string[];
    cons?: string[];
    createdAt: string;
    isAnonymous?: boolean;
  }>;
  statistics: {
    recommendationRate: number;
    averageGrade: string;
    passRate: number;
    averageWeeklyHours: number;
  };
}

const CourseEvaluation: React.FC<CourseEvaluationProps> = ({ courseId }) => {
  const [evaluation, setEvaluation] = useState<CourseEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load course evaluation data
  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock evaluation data - in real app, this would come from API
      const mockEvaluation: CourseEvaluation = {
        overallRating: 4.3,
        totalRatings: 89,
        ratingDistribution: {
          5: 45,
          4: 28,
          3: 12,
          2: 3,
          1: 1
        },
        categories: {
          courseContent: 4.2,
          teachingQuality: 4.5,
          courseDifficulty: 3.4,
          workload: 3.6,
          usefulness: 4.4
        },
        reviews: [
          {
            id: '1',
            studentName: '王小明',
            rating: 5,
            comment: '这门课程内容非常充实，老师讲解清晰，收获很大！',
            pros: ['内容充实', '老师认真负责', '实践性强'],
            cons: ['作业量稍大'],
            createdAt: '2024-12-10',
            isAnonymous: false
          },
          {
            id: '2',
            studentName: '李同学',
            rating: 4,
            comment: '整体不错，就是有一定难度，需要花时间预习。',
            pros: ['知识点全面', '案例丰富'],
            cons: ['进度稍快', '需要一定基础'],
            createdAt: '2024-12-05',
            isAnonymous: false
          },
          {
            id: '3',
            studentName: '匿名同学',
            rating: 4,
            comment: '课程质量很高，推荐给有兴趣的同学。',
            pros: ['课程设计合理', '互动性好'],
            cons: [],
            createdAt: '2024-11-28',
            isAnonymous: true
          }
        ],
        statistics: {
          recommendationRate: 87,
          averageGrade: 'B+',
          passRate: 94,
          averageWeeklyHours: 6
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setEvaluation(mockEvaluation);
    } catch (err: any) {
      setError(err.message || '加载课程评价失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluation();
  }, [courseId]);

  if (loading) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <StarOutlined /> 课程评价
          </div>
        }
        className={styles.evaluationCard}
      >
        <div className={styles.loadingContainer}>
          <Spin tip="加载评价数据中..." />
        </div>
      </Card>
    );
  }

  if (error || !evaluation) {
    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <StarOutlined /> 课程评价
          </div>
        }
        className={styles.evaluationCard}
      >
        <Empty
          description="暂无评价数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const totalRatings = evaluation.totalRatings;

  return (
    <Card
      title={
        <div className={styles.cardTitle}>
          <StarOutlined /> 课程评价
        </div>
      }
      className={styles.evaluationCard}
    >
      {/* Overall Rating Section */}
      <div className={styles.overallRating}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <div className={styles.ratingMain}>
              <div className={styles.ratingScore}>{evaluation.overallRating}</div>
              <Rate disabled value={evaluation.overallRating} allowHalf />
              <div className={styles.ratingCount}>
                {totalRatings} 条评价
              </div>
            </div>
          </Col>
          <Col xs={24} sm={16}>
            <div className={styles.ratingDistribution}>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className={styles.ratingBar}>
                  <span className={styles.starLabel}>{star}星</span>
                  <Progress
                    percent={Math.round((evaluation.ratingDistribution[star as keyof typeof evaluation.ratingDistribution] / totalRatings) * 100)}
                    showInfo={false}
                    strokeColor="#faad14"
                    size="small"
                  />
                  <span className={styles.starCount}>
                    {evaluation.ratingDistribution[star as keyof typeof evaluation.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      {/* Category Ratings */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>详细评分</h4>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <div className={styles.categoryRating}>
              <div className={styles.categoryName}>课程内容</div>
              <Rate disabled value={evaluation.categories.courseContent} size="small" />
              <span className={styles.categoryScore}>{evaluation.categories.courseContent}</span>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className={styles.categoryRating}>
              <div className={styles.categoryName}>教学质量</div>
              <Rate disabled value={evaluation.categories.teachingQuality} size="small" />
              <span className={styles.categoryScore}>{evaluation.categories.teachingQuality}</span>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className={styles.categoryRating}>
              <div className={styles.categoryName}>课程难度</div>
              <Rate disabled value={evaluation.categories.courseDifficulty} size="small" />
              <span className={styles.categoryScore}>{evaluation.categories.courseDifficulty}</span>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className={styles.categoryRating}>
              <div className={styles.categoryName}>作业量</div>
              <Rate disabled value={evaluation.categories.workload} size="small" />
              <span className={styles.categoryScore}>{evaluation.categories.workload}</span>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className={styles.categoryRating}>
              <div className={styles.categoryName}>实用性</div>
              <Rate disabled value={evaluation.categories.usefulness} size="small" />
              <span className={styles.categoryScore}>{evaluation.categories.usefulness}</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Statistics */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <TrophyOutlined /> 课程统计
        </h4>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="推荐率"
              value={evaluation.statistics.recommendationRate}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="平均成绩"
              value={evaluation.statistics.averageGrade}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="通过率"
              value={evaluation.statistics.passRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="周学时"
              value={evaluation.statistics.averageWeeklyHours}
              suffix="h"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </div>

      {/* Recent Reviews */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <CommentOutlined /> 学生评价
        </h4>
        <List
          itemLayout="vertical"
          size="large"
          pagination={evaluation.reviews.length > 3 ? {
            pageSize: 3,
            size: 'small'
          } : false}
          dataSource={evaluation.reviews}
          renderItem={review => (
            <List.Item
              key={review.id}
              className={styles.reviewItem}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={review.avatar}
                    icon={<CommentOutlined />}
                  >
                    {review.isAnonymous ? '匿' : review.studentName[0]}
                  </Avatar>
                }
                title={
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewAuthor}>
                      {review.isAnonymous ? '匿名同学' : review.studentName}
                    </span>
                    <Rate disabled value={review.rating} size="small" />
                    <span className={styles.reviewDate}>
                      <ClockCircleOutlined /> {review.createdAt}
                    </span>
                  </div>
                }
                description={
                  <div className={styles.reviewContent}>
                    <p className={styles.reviewComment}>{review.comment}</p>

                    {/* Pros and Cons */}
                    {(review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0) ? (
                      <div className={styles.prosCons}>
                        {review.pros && review.pros.length > 0 && (
                          <div className={styles.pros}>
                            <span className={styles.prosConsLabel}>
                              <ThumbsUpOutlined /> 优点：
                            </span>
                            {review.pros.map((pro, index) => (
                              <span key={index} className={styles.prosConsItem}>{pro}</span>
                            ))}
                          </div>
                        )}
                        {review.cons && review.cons.length > 0 && (
                          <div className={styles.cons}>
                            <span className={styles.prosConsLabel}>不足：</span>
                            {review.cons.map((con, index) => (
                              <span key={index} className={styles.prosConsItem}>{con}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};

export default CourseEvaluation;