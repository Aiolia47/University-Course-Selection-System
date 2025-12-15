import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'compact';

interface UIState {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  notifications: Notification[];
  currentPageTitle: string;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  breadcrumbs: BreadcrumbItem[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

interface BreadcrumbItem {
  title: string;
  path?: string;
}

const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
  loading: {},
  errors: {},
  notifications: [],
  currentPageTitle: '',
  screenSize: 'lg',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.unshift(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setCurrentPageTitle: (state, action: PayloadAction<string>) => {
      state.currentPageTitle = action.payload;
    },
    setScreenSize: (state, action: PayloadAction<UIState['screenSize']>) => {
      state.screenSize = action.payload;

      // Auto-collapse sidebar on mobile
      if (action.payload === 'xs' || action.payload === 'sm') {
        state.sidebarCollapsed = true;
      }
    },
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<BreadcrumbItem>) => {
      state.breadcrumbs.push(action.payload);
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setLoading,
  clearLoading,
  clearAllLoading,
  setError,
  clearError,
  clearAllErrors,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setCurrentPageTitle,
  setScreenSize,
  setBreadcrumbs,
  addBreadcrumb,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectLoading = (key: string) => (state: { ui: UIState }) => state.ui.loading[key] || false;
export const selectError = (key: string) => (state: { ui: UIState }) => state.ui.errors[key];
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectCurrentPageTitle = (state: { ui: UIState }) => state.ui.currentPageTitle;
export const selectScreenSize = (state: { ui: UIState }) => state.ui.screenSize;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;

export default uiSlice.reducer;