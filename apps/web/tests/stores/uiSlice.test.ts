import uiReducer, {
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
} from '@/stores/slices/uiSlice';
import { ThemeMode } from '@/stores/slices/uiSlice';

describe('UI Slice', () => {
  const initialState = {
    theme: 'light' as ThemeMode,
    sidebarCollapsed: false,
    loading: {},
    errors: {},
    notifications: [],
    currentPageTitle: '',
    screenSize: 'lg' as const,
    breadcrumbs: [],
  };

  it('should return the initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('Theme Actions', () => {
    it('should handle setTheme', () => {
      const action = setTheme('dark');
      const state = uiReducer(undefined, action);

      expect(state.theme).toBe('dark');
    });

    it('should handle setTheme to compact', () => {
      const action = setTheme('compact');
      const state = uiReducer(undefined, action);

      expect(state.theme).toBe('compact');
    });
  });

  describe('Sidebar Actions', () => {
    it('should handle toggleSidebar', () => {
      // Start with collapsed = false
      let state = uiReducer(undefined, { type: 'unknown' });
      expect(state.sidebarCollapsed).toBe(false);

      // Toggle to true
      state = uiReducer(state, toggleSidebar());
      expect(state.sidebarCollapsed).toBe(true);

      // Toggle back to false
      state = uiReducer(state, toggleSidebar());
      expect(state.sidebarCollapsed).toBe(false);
    });

    it('should handle setSidebarCollapsed', () => {
      const action = setSidebarCollapsed(true);
      const state = uiReducer(undefined, action);

      expect(state.sidebarCollapsed).toBe(true);
    });
  });

  describe('Loading Actions', () => {
    it('should handle setLoading', () => {
      const action = setLoading({ key: 'login', loading: true });
      const state = uiReducer(undefined, action);

      expect(state.loading.login).toBe(true);
    });

    it('should handle clearLoading', () => {
      // Start with loading state
      let state = uiReducer(undefined, setLoading({ key: 'login', loading: true }));
      expect(state.loading.login).toBe(true);

      // Clear specific loading
      state = uiReducer(state, clearLoading('login'));
      expect(state.loading.login).toBeUndefined();
    });

    it('should handle clearAllLoading', () => {
      // Start with multiple loading states
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, setLoading({ key: 'login', loading: true }));
      state = uiReducer(state, setLoading({ key: 'register', loading: true }));

      expect(state.loading.login).toBe(true);
      expect(state.loading.register).toBe(true);

      // Clear all loading
      state = uiReducer(state, clearAllLoading());
      expect(state.loading).toEqual({});
    });
  });

  describe('Error Actions', () => {
    it('should handle setError', () => {
      const action = setError({ key: 'login', error: 'Login failed' });
      const state = uiReducer(undefined, action);

      expect(state.errors.login).toBe('Login failed');
    });

    it('should handle clearError', () => {
      // Start with error state
      let state = uiReducer(undefined, setError({ key: 'login', error: 'Login failed' }));
      expect(state.errors.login).toBe('Login failed');

      // Clear specific error
      state = uiReducer(state, clearError('login'));
      expect(state.errors.login).toBeUndefined();
    });

    it('should handle clearAllErrors', () => {
      // Start with multiple error states
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, setError({ key: 'login', error: 'Login failed' }));
      state = uiReducer(state, setError({ key: 'register', error: 'Register failed' }));

      expect(state.errors.login).toBe('Login failed');
      expect(state.errors.register).toBe('Register failed');

      // Clear all errors
      state = uiReducer(state, clearAllErrors());
      expect(state.errors).toEqual({});
    });
  });

  describe('Notification Actions', () => {
    it('should handle addNotification', () => {
      const action = addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
      const state = uiReducer(undefined, action);

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
    });

    it('should handle multiple notifications', () => {
      let state = uiReducer(undefined, { type: 'unknown' });

      // Add first notification
      state = uiReducer(state, addNotification({
        type: 'success',
        title: 'Success 1',
      }));

      // Add second notification
      state = uiReducer(state, addNotification({
        type: 'error',
        title: 'Error 1',
      }));

      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0].title).toBe('Error 1'); // New notifications are added to the front
      expect(state.notifications[1].title).toBe('Success 1');
    });

    it('should handle removeNotification', () => {
      // Start with a notification
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, addNotification({
        type: 'success',
        title: 'Test',
      }));

      const notificationId = state.notifications[0].id;
      expect(state.notifications).toHaveLength(1);

      // Remove notification
      state = uiReducer(state, removeNotification(notificationId));
      expect(state.notifications).toHaveLength(0);
    });

    it('should handle clearAllNotifications', () => {
      // Start with multiple notifications
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, addNotification({ type: 'success', title: 'Success 1' }));
      state = uiReducer(state, addNotification({ type: 'error', title: 'Error 1' }));

      expect(state.notifications).toHaveLength(2);

      // Clear all notifications
      state = uiReducer(state, clearAllNotifications());
      expect(state.notifications).toHaveLength(0);
    });
  });

  describe('Page Actions', () => {
    it('should handle setCurrentPageTitle', () => {
      const action = setCurrentPageTitle('Dashboard');
      const state = uiReducer(undefined, action);

      expect(state.currentPageTitle).toBe('Dashboard');
    });
  });

  describe('Screen Size Actions', () => {
    it('should handle setScreenSize', () => {
      const action = setScreenSize('sm');
      const state = uiReducer(undefined, action);

      expect(state.screenSize).toBe('sm');
    });

    it('should auto-collapse sidebar on mobile', () => {
      // Start with expanded sidebar
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, setSidebarCollapsed(false));
      expect(state.sidebarCollapsed).toBe(false);

      // Set screen size to mobile
      state = uiReducer(state, setScreenSize('xs'));
      expect(state.sidebarCollapsed).toBe(true);

      // Set screen size to small mobile
      state = uiReducer(state, setScreenSize('sm'));
      expect(state.sidebarCollapsed).toBe(true);

      // Set screen size to tablet (should not auto-collapse)
      state = uiReducer(state, setScreenSize('md'));
      expect(state.sidebarCollapsed).toBe(true); // Stays collapsed
    });
  });

  describe('Breadcrumb Actions', () => {
    it('should handle setBreadcrumbs', () => {
      const breadcrumbs = [
        { title: 'Home', path: '/' },
        { title: 'Dashboard', path: '/dashboard' },
      ];
      const action = setBreadcrumbs(breadcrumbs);
      const state = uiReducer(undefined, action);

      expect(state.breadcrumbs).toEqual(breadcrumbs);
    });

    it('should handle addBreadcrumb', () => {
      // Start with existing breadcrumb
      let state = uiReducer(undefined, { type: 'unknown' });
      state = uiReducer(state, setBreadcrumbs([
        { title: 'Home', path: '/' },
      ]));

      // Add new breadcrumb
      state = uiReducer(state, addBreadcrumb({
        title: 'Dashboard',
        path: '/dashboard',
      }));

      expect(state.breadcrumbs).toHaveLength(2);
      expect(state.breadcrumbs[0]).toEqual({ title: 'Home', path: '/' });
      expect(state.breadcrumbs[1]).toEqual({ title: 'Dashboard', path: '/dashboard' });
    });
  });
});