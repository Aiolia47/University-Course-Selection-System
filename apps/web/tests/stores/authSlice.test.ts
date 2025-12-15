import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginAsync,
  registerAsync,
  logoutAsync,
  refreshTokenAsync,
  getCurrentUserAsync,
  clearError,
  setLoading,
  initializeAuth
} from '@/stores/slices/authSlice';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@bmad7/shared';

// Mock the authApi
jest.mock('@/stores/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
  }
}));

import { authApi } from '@/stores/api/authApi';

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'student',
  avatar: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockAuthResponse: AuthResponse = {
  user: mockUser,
  token: 'access-token',
  refreshToken: 'refresh-token',
};

describe('Auth Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });

    it('should initialize auth state from localStorage', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('refreshToken', 'stored-refresh-token');

      const state = authReducer(undefined, { type: 'unknown' });
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('stored-token');
      expect(state.refreshToken).toBe('stored-refresh-token');
    });
  });

  describe('Login Action', () => {
    const loginData: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    };

    it('should handle pending login', () => {
      const action = { type: loginAsync.pending.type };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle successful login', () => {
      const action = {
        type: loginAsync.fulfilled.type,
        payload: mockAuthResponse,
      };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);

      // Check localStorage
      expect(localStorage.getItem('token')).toBe('access-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    });

    it('should handle failed login', () => {
      const action = {
        type: loginAsync.rejected.type,
        payload: 'Invalid credentials',
      };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should call login API when loginAsync is dispatched', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await store.dispatch(loginAsync(loginData));

      expect(authApi.login).toHaveBeenCalledWith(loginData);
    });
  });

  describe('Register Action', () => {
    const registerData: RegisterRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should handle successful registration', () => {
      const action = {
        type: registerAsync.fulfilled.type,
        payload: mockAuthResponse,
      };
      const state = authReducer(undefined, action);

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('access-token');
    });

    it('should call register API when registerAsync is dispatched', async () => {
      (authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await store.dispatch(registerAsync(registerData));

      expect(authApi.register).toHaveBeenCalledWith(registerData);
    });
  });

  describe('Logout Action', () => {
    it('should handle logout', () => {
      // Start with authenticated state
      let state = authReducer(undefined, {
        type: loginAsync.fulfilled.type,
        payload: mockAuthResponse,
      });

      // Then logout
      const action = { type: logoutAsync.fulfilled.type };
      state = authReducer(state, action);

      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);

      // Check localStorage is cleared
      expect(localStorage.getItem('token')).toBe(null);
      expect(localStorage.getItem('refreshToken')).toBe(null);
    });

    it('should call logout API when logoutAsync is dispatched', async () => {
      (authApi.logout as jest.Mock).mockResolvedValue({});

      await store.dispatch(logoutAsync());

      expect(authApi.logout).toHaveBeenCalled();
    });
  });

  describe('Refresh Token Action', () => {
    it('should handle successful token refresh', () => {
      // Start with authenticated state
      let state = authReducer(undefined, {
        type: loginAsync.fulfilled.type,
        payload: mockAuthResponse,
      });

      const newTokenResponse = {
        ...mockAuthResponse,
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      const action = {
        type: refreshTokenAsync.fulfilled.type,
        payload: newTokenResponse,
      };
      state = authReducer(state, action);

      expect(state.isLoading).toBe(false);
      expect(state.token).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
    });

    it('should handle failed token refresh', () => {
      const action = {
        type: refreshTokenAsync.rejected.type,
        payload: 'Token refresh failed',
      };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Token refresh failed');
    });
  });

  describe('Get Current User Action', () => {
    it('should handle successful get current user', () => {
      const action = {
        type: getCurrentUserAsync.fulfilled.type,
        payload: mockUser,
      };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBe(null);
    });

    it('should handle failed get current user with 401 error', () => {
      const action = {
        type: getCurrentUserAsync.rejected.type,
        payload: '401 Unauthorized',
      };
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBe(null);
      expect(state.refreshToken).toBe(null);
    });
  });

  describe('Actions', () => {
    it('should handle clearError', () => {
      // Start with error state
      let state = authReducer(undefined, {
        type: loginAsync.rejected.type,
        payload: 'Some error',
      });

      // Clear error
      const action = clearError();
      state = authReducer(state, action);

      expect(state.error).toBe(null);
    });

    it('should handle setLoading', () => {
      const action = setLoading(true);
      const state = authReducer(undefined, action);

      expect(state.isLoading).toBe(true);
    });

    it('should handle initializeAuth', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('refreshToken', 'stored-refresh-token');

      const action = initializeAuth();
      const state = authReducer(undefined, action);

      expect(state.token).toBe('stored-token');
      expect(state.refreshToken).toBe('stored-refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });
});