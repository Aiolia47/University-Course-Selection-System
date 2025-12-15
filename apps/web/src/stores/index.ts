import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import coursesSlice from './slices/coursesSlice';
import selectionsSlice from './slices/selectionsSlice';
import uiSlice from './slices/uiSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    courses: coursesSlice,
    selections: selectionsSlice,
    ui: uiSlice,
    api: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect behavior
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;