import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Pagination,
  Spin,
  Empty,
  Input,
  Select,
  Space,
  Button,
  Drawer,
  message,
  Card,
  Typography,
  Alert,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  HeartOutlined,
  CompareArrowsOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/stores';
import {
  fetchCoursesAsync,
  setFilters,
  clearFilters,
  setSearchQuery,
  toggleFavorite,
  toggleCompare,
  clearCompareList,
  loadFavorites,
  loadCompareList,
  clearError
} from '@/stores/slices/coursesSlice';
import { CourseFilters, CourseStatus, DayOfWeek } from '@/types/course';
import CourseCard from '@/components/courses/CourseCard';
import CourseGridSkeleton from '@/components/courses/CourseGridSkeleton';
import FilterPanel from '@/components/courses/FilterPanel';
import ComparePanel from '@/components/courses/ComparePanel';
import { useDebounce } from '@/hooks/useDebounce';
import './CourseListPage.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const CourseListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    courses,
    isLoading,
    error,
    pagination,
    filters,
    searchQuery,
    favorites,
    compareList
  } = useSelector((state: RootState) => state.courses);

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [compareDrawerVisible, setCompareDrawerVisible] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery || '');

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCourses');
    const savedCompareList = localStorage.getItem('compareCourses');

    if (savedFavorites) {
      dispatch(loadFavorites(JSON.parse(savedFavorites)));
    }
    if (savedCompareList) {
      dispatch(loadCompareList(JSON.parse(savedCompareList)));
    }
  }, [dispatch]);

  // Fetch courses on mount and when filters/pagination change
  useEffect(() => {
    dispatch(fetchCoursesAsync({
      page: pagination.page,
      limit: pagination.limit,
      filters: {
        ...filters,
        sortBy: sortField,
        sortOrder: sortOrder
      }
    }));
  }, [dispatch, filters, pagination.page, pagination.limit, sortField, sortOrder]);

  const handleSearch = (value: string) => {
    setLocalSearchQuery(value);
  };

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      dispatch(setSearchQuery(debouncedSearchQuery));
      const newFilters = { ...filters, search: debouncedSearchQuery };
      dispatch(setFilters(newFilters));
      // Reset to first page when searching
      dispatch(fetchCoursesAsync({
        page: 1,
        limit: pagination.limit,
        filters: newFilters
      }));
    }
  }, [debouncedSearchQuery]);

  const handleFilter = (newFilters: CourseFilters) => {
    dispatch(setFilters(newFilters));
    // Reset to first page when filtering
    dispatch(fetchCoursesAsync({
      page: 1,
      limit: pagination.limit,
      filters: newFilters
    }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSortField('name');
    setSortOrder('ASC');
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    dispatch(fetchCoursesAsync({
      page,
      limit: pageSize || pagination.limit,
      filters: {
        ...filters,
        sortBy: sortField,
        sortOrder: sortOrder
      }
    }));
  };

  const handleViewDetails = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleFavorite = (courseId: string) => {
    const isCurrentlyFavorite = favorites.includes(courseId);
    dispatch(toggleFavorite(courseId));
    message.success(isCurrentlyFavorite ? '已取消收藏' : '已添加到收藏');
  };

  const handleCompare = (courseId: string) => {
    const isCurrentlyInCompare = compareList.includes(courseId);
    if (isCurrentlyInCompare) {
      dispatch(toggleCompare(courseId));
      message.success('已从对比列表移除');
    } else {
      if (compareList.length >= 3) {
        message.warning('最多只能对比3门课程');
        return;
      }
      dispatch(toggleCompare(courseId));
      message.success('已添加到对比列表');
    }
  };

  const handleClearCompare = () => {
    dispatch(clearCompareList());
    setCompareDrawerVisible(false);
  };

  const renderCourseGrid = () => {
    // Show skeleton on initial load
    if (isLoading && courses.length === 0) {
      return <CourseGridSkeleton rows={3} />;
    }

    // Show error state
    if (error && !isLoading) {
      return (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => {
                dispatch(fetchCoursesAsync({
                  page: pagination.page,
                  limit: pagination.limit,
                  filters
                }));
              }}>
                重试
              </Button>
              <Button size="small" onClick={() => {
                dispatch(clearError());
                dispatch(clearFilters());
              }}>
                清除筛选
              </Button>
            </Space>
          }
        />
      );
    }

    // Show empty state
    if (courses.length === 0 && !isLoading) {
      return (
        <Empty
          description={
            <div>
              <Text>暂无课程</Text>
              {filters.search && (
                <div>
                  <Text type="secondary">没有找到与 "{filters.search}" 相关的课程</Text>
                </div>
              )}
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {filters.search && (
            <Button type="primary" onClick={handleClearFilters}>
              清除搜索条件
            </Button>
          )}
        </Empty>
      );
    }

    // Show course grid
    return (
      <Row gutter={[16, 16]} className="course-list-grid">
        {courses.map((course) => (
          <Col
            key={course.id}
            xs={24}
            sm={12}
            md={8}
            lg={6}
            xl={6}
          >
            <CourseCard
              course={course}
              onViewDetails={handleViewDetails}
              onFavorite={handleFavorite}
              isFavorite={favorites.includes(course.id)}
              compareMode={true}
              onCompare={handleCompare}
              isInCompareList={compareList.includes(course.id)}
            />
          </Col>
        ))}
        {/* Show skeleton cards during pagination loading */}
        {isLoading && courses.length > 0 && (
          <>
            {Array.from({ length: 4 }).map((_, index) => (
              <Col
                key={`skeleton-${index}`}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                xl={6}
              >
                <CourseGridSkeleton count={1} />
              </Col>
            ))}
          </>
        )}
      </Row>
    );
  };

  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <div className="course-list-title">
          <Title level={2}>课程列表</Title>
          <Text type="secondary">
            共 {pagination.total} 门课程
          </Text>
        </div>

        <div className="course-list-actions">
          <Space wrap>
            <Search
              placeholder="搜索课程名称、代码或教师"
              allowClear
              enterButton
              size="large"
              style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              value={localSearchQuery}
            />

            <Button
              icon={<FilterOutlined />}
              size="large"
              onClick={() => setFilterDrawerVisible(true)}
            >
              筛选
            </Button>

            <Button
              icon={<SortAscendingOutlined />}
              size="large"
              onClick={() => {
                // Toggle sort order for current field
                const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
                setSortOrder(newOrder);
              }}
            >
              排序
            </Button>

            <Button
              icon={<ClearOutlined />}
              size="large"
              onClick={handleClearFilters}
            >
              清除
            </Button>

            <Tooltip title={`收藏 (${favorites.length})`}>
              <Button
                icon={<HeartOutlined />}
                size="large"
              >
                收藏 ({favorites.length})
              </Button>
            </Tooltip>

            <Tooltip title={`对比 (${compareList.length}/3)`}>
              <Button
                icon={<CompareArrowsOutlined />}
                size="large"
                onClick={() => setCompareDrawerVisible(true)}
                disabled={compareList.length === 0}
              >
                对比 ({compareList.length}/3)
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      <div className="course-list-content">
        {renderCourseGrid()}
      </div>

      {courses.length > 0 && (
        <div className="course-list-pagination">
          <Pagination
            current={pagination.page}
            total={pagination.total}
            pageSize={pagination.limit}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={handlePageChange}
            onShowSizeChange={(current, size) => handlePageChange(current, size)}
          />
        </div>
      )}

      <Drawer
        title="筛选条件"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={320}
      >
        <FilterPanel
          filters={filters}
          onFilter={handleFilter}
          onClear={handleClearFilters}
        />
      </Drawer>

      <Drawer
        title="课程对比"
        placement="right"
        onClose={() => setCompareDrawerVisible(false)}
        open={compareDrawerVisible}
        width={480}
      >
        <ComparePanel
          courseIds={compareList}
          onRemove={(courseId) => handleCompare(courseId)}
          onClear={handleClearCompare}
        />
      </Drawer>
    </div>
  );
};

export default CourseListPage;