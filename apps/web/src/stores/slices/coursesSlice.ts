import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, CourseFilters, PaginatedResponse } from '@/types/course';
import courseService from '@/services/courseService';

interface CoursesState {
  courses: Course[];
  currentCourse: Course | null;
  filters: CourseFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  searchQuery: string;
  favorites: string[];
  compareList: string[];
  isCompareMode: boolean;
}

const initialState: CoursesState = {
  courses: [],
  currentCourse: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isDetailLoading: false,
  error: null,
  searchQuery: '',
  favorites: [],
  compareList: [],
  isCompareMode: false,
};

// Async thunks
export const fetchCoursesAsync = createAsyncThunk(
  'courses/fetchCourses',
  async (params: { page?: number; limit?: number; filters?: CourseFilters }, { rejectWithValue }) => {
    try {
      const response = await courseService.getCourses(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseByIdAsync = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const course = await courseService.getCourseById(courseId);
      return course;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch course');
    }
  }
);

export const searchCoursesAsync = createAsyncThunk(
  'courses/searchCourses',
  async (params: { query: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await courseService.searchCourses(params.query, params);
      return { ...response, query: params.query };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search courses');
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<CourseFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
      state.searchQuery = '';
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
    setPagination: (state, action: PayloadAction<Partial<CoursesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Optimistic update for course selection status
    updateCourseEnrollment: (state, action: PayloadAction<{ courseId: string; enrolled: boolean; enrolledCount: number }>) => {
      const course = state.courses.find(c => c.id === action.payload.courseId);
      if (course) {
        // This would be handled by optimistic updates in a real implementation
        course.enrolled = action.payload.enrolledCount;
      }
      if (state.currentCourse?.id === action.payload.courseId) {
        state.currentCourse.enrolled = action.payload.enrolledCount;
      }
    },
    // Favorite management
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const courseId = action.payload;
      const index = state.favorites.indexOf(courseId);
      if (index > -1) {
        state.favorites.splice(index, 1);
      } else {
        state.favorites.push(courseId);
      }
      // Persist to localStorage
      localStorage.setItem('favoriteCourses', JSON.stringify(state.favorites));
    },
    loadFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload;
    },
    // Compare list management
    toggleCompare: (state, action: PayloadAction<string>) => {
      const courseId = action.payload;
      const index = state.compareList.indexOf(courseId);
      if (index > -1) {
        state.compareList.splice(index, 1);
      } else {
        if (state.compareList.length >= 3) {
          // Don't add more than 3 courses to compare
          return;
        }
        state.compareList.push(courseId);
      }
      // Persist to localStorage
      localStorage.setItem('compareCourses', JSON.stringify(state.compareList));
    },
    removeFromCompare: (state, action: PayloadAction<string>) => {
      const courseId = action.payload;
      const index = state.compareList.indexOf(courseId);
      if (index > -1) {
        state.compareList.splice(index, 1);
      }
      // Persist to localStorage
      localStorage.setItem('compareCourses', JSON.stringify(state.compareList));
    },
    clearCompareList: (state) => {
      state.compareList = [];
      state.isCompareMode = false;
      // Clear from localStorage
      localStorage.removeItem('compareCourses');
    },
    loadCompareList: (state, action: PayloadAction<string[]>) => {
      state.compareList = action.payload;
    },
    setCompareMode: (state, action: PayloadAction<boolean>) => {
      state.isCompareMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCoursesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoursesAsync.fulfilled, (state, action: PayloadAction<PaginatedResponse<Course>>) => {
        state.isLoading = false;
        state.courses = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchCoursesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch course by ID
      .addCase(fetchCourseByIdAsync.pending, (state) => {
        state.isDetailLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseByIdAsync.fulfilled, (state, action: PayloadAction<Course>) => {
        state.isDetailLoading = false;
        state.currentCourse = action.payload;
        state.error = null;
      })
      .addCase(fetchCourseByIdAsync.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.error = action.payload as string;
        state.currentCourse = null;
      })

      // Search courses
      .addCase(searchCoursesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchCoursesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.searchQuery = action.payload.query;
        state.error = null;
      })
      .addCase(searchCoursesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSearchQuery,
  clearCurrentCourse,
  setPagination,
  updateCourseEnrollment,
  toggleFavorite,
  loadFavorites,
  toggleCompare,
  removeFromCompare,
  clearCompareList,
  loadCompareList,
  setCompareMode,
} = coursesSlice.actions;

export default coursesSlice.reducer;