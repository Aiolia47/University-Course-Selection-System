import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CourseSelection, PaginatedResponse } from '@bmad7/shared';
import { selectionsApi } from '../api/selectionsApi';

interface SelectionsState {
  selections: CourseSelection[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: SelectionsState = {
  selections: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchSelectionsAsync = createAsyncThunk(
  'selections/fetchSelections',
  async (params: { page?: number; limit?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await selectionsApi.getSelections(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch selections');
    }
  }
);

export const createSelectionAsync = createAsyncThunk(
  'selections/createSelection',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const selection = await selectionsApi.createSelection(courseId);
      return selection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create selection');
    }
  }
);

export const updateSelectionAsync = createAsyncThunk(
  'selections/updateSelection',
  async ({ selectionId, status }: { selectionId: string; status: 'approved' | 'rejected' }, { rejectWithValue }) => {
    try {
      const updatedSelection = await selectionsApi.updateSelection(selectionId, { status });
      return updatedSelection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update selection');
    }
  }
);

export const deleteSelectionAsync = createAsyncThunk(
  'selections/deleteSelection',
  async (selectionId: string, { rejectWithValue }) => {
    try {
      await selectionsApi.deleteSelection(selectionId);
      return selectionId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete selection');
    }
  }
);

const selectionsSlice = createSlice({
  name: 'selections',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action: PayloadAction<Partial<SelectionsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // Optimistic update for selection status
    updateSelectionStatusOptimistic: (state, action: PayloadAction<{ selectionId: string; status: 'pending' | 'approved' | 'rejected' }>) => {
      const selection = state.selections.find(s => s.id === action.payload.selectionId);
      if (selection) {
        selection.status = action.payload.status;
      }
    },
    // Optimistic removal of selection
    removeSelectionOptimistic: (state, action: PayloadAction<string>) => {
      state.selections = state.selections.filter(s => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch selections
      .addCase(fetchSelectionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSelectionsAsync.fulfilled, (state, action: PayloadAction<PaginatedResponse<CourseSelection>>) => {
        state.isLoading = false;
        state.selections = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchSelectionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create selection
      .addCase(createSelectionAsync.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createSelectionAsync.fulfilled, (state, action: PayloadAction<CourseSelection>) => {
        state.isSubmitting = false;
        state.selections.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createSelectionAsync.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // Update selection
      .addCase(updateSelectionAsync.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateSelectionAsync.fulfilled, (state, action: PayloadAction<CourseSelection>) => {
        state.isSubmitting = false;
        const index = state.selections.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.selections[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSelectionAsync.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // Delete selection
      .addCase(deleteSelectionAsync.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteSelectionAsync.fulfilled, (state, action: PayloadAction<string>) => {
        state.isSubmitting = false;
        state.selections = state.selections.filter(s => s.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.error = null;
      })
      .addCase(deleteSelectionAsync.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setPagination,
  updateSelectionStatusOptimistic,
  removeSelectionOptimistic,
} = selectionsSlice.actions;

export default selectionsSlice.reducer;