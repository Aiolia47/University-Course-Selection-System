import React, { useMemo, useCallback, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import CourseCard from './CourseCard';
import { Course, CourseCardProps } from '@/types/course';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualCourseGridProps {
  courses: Course[];
  columns: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  onCourseSelect?: (courseId: string) => void;
  onCourseFavorite?: (courseId: string) => void;
  onCourseViewDetails?: (courseId: string) => void;
  onCourseCompare?: (courseId: string) => void;
  favorites: string[];
  compareList: string[];
}

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    courses: Course[];
    columns: number;
    columnCount: number;
    onCourseSelect?: (courseId: string) => void;
    onCourseFavorite?: (courseId: string) => void;
    onCourseViewDetails?: (courseId: string) => void;
    onCourseCompare?: (courseId: string) => void;
    favorites: string[];
    compareList: string[];
  };
}

const GridCell: React.FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { courses, columns, columnCount, onCourseSelect, onCourseFavorite, onCourseViewDetails, onCourseCompare, favorites, compareList } = data;
  const index = rowIndex * columns + columnIndex;
  const course = courses[index];

  if (!course || index >= courses.length) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="virtual-grid-cell">
      <CourseCard
        course={course}
        onSelect={onCourseSelect}
        onViewDetails={onCourseViewDetails}
        onFavorite={onCourseFavorite}
        isFavorite={favorites.includes(course.id)}
        compareMode={true}
        onCompare={onCourseCompare}
        isInCompareList={compareList.includes(course.id)}
      />
    </div>
  );
};

const VirtualCourseGrid: React.FC<VirtualCourseGridProps> = ({
  courses,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 },
  onCourseSelect,
  onCourseFavorite,
  onCourseViewDetails,
  onCourseCompare,
  favorites,
  compareList
}) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Determine column count based on container width
  const getColumnsForWidth = useCallback((width: number) => {
    if (width >= 1600) return columns.xxl || 6;
    if (width >= 1200) return columns.xl || 4;
    if (width >= 992) return columns.lg || 4;
    if (width >= 768) return columns.md || 3;
    if (width >= 576) return columns.sm || 2;
    return columns.xs || 1;
  }, [columns]);

  // Calculate grid dimensions
  const gridData = useMemo(() => {
    const columnCount = containerSize.width > 0 ? getColumnsForWidth(containerSize.width) : 4;
    const rowCount = Math.ceil(courses.length / columnCount);

    return {
      columnCount,
      rowCount,
      height: rowCount * 400, // Approximate height per row
    };
  }, [courses.length, containerSize, getColumnsForWidth]);

  // Memoize cell data to prevent unnecessary re-renders
  const cellData = useMemo(() => ({
    courses,
    columns: gridData.columnCount,
    columnCount: gridData.columnCount,
    onCourseSelect,
    onCourseFavorite,
    onCourseViewDetails,
    onCourseCompare,
    favorites,
    compareList,
  }), [
    courses,
    gridData.columnCount,
    onCourseSelect,
    onCourseFavorite,
    onCourseViewDetails,
    onCourseCompare,
    favorites,
    compareList,
  ]);

  // For small lists, use regular grid instead of virtualization
  if (courses.length < 20) {
    return (
      <div className="regular-course-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridData.columnCount}, 1fr)`, gap: '16px' }}>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onSelect={onCourseSelect}
            onViewDetails={onCourseViewDetails}
            onFavorite={onCourseFavorite}
            isFavorite={favorites.includes(course.id)}
            compareMode={true}
            onCompare={onCourseCompare}
            isInCompareList={compareList.includes(course.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="virtual-course-grid" style={{ height: '800px' }}>
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = getColumnsForWidth(width);
          const rowCount = Math.ceil(courses.length / columnCount);

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={Math.floor(width / columnCount) - 16} // Subtract gap
              height={height}
              rowCount={rowCount}
              rowHeight={400}
              width={width}
              itemData={cellData}
              className="virtual-grid"
            >
              {GridCell}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
};

export default VirtualCourseGrid;