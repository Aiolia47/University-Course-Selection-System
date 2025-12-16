import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import coursesSlice from './slices/coursesSlice';
import selectionsSlice from './slices/selectionsSlice';
import uiSlice from './slices/uiSlice';
import { api } from './api';

export const rootReducer = combineReducers({
  auth: authSlice,
  courses: coursesSlice,
  selections: selectionsSlice,
  ui: uiSlice,
  api: api.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;