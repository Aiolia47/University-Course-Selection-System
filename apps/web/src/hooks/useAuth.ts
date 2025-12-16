import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginAsync,
  logoutAsync,
  refreshTokenAsync,
  getCurrentUserAsync,
  clearError,
  initializeAuth,
  AppDispatch
} from '../stores/slices/authSlice';
import { RootState } from '../stores/rootReducer';
import { authService, LoginRequest, RegisterRequest } from '../services/authService';

export interface UseAuthReturn {
  // State
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;

  // Helpers
  checkAuthStatus: () => Promise<boolean>;
  hasRole: (role: string) => boolean;
  isInitialized: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    refreshToken: refreshTokenValue
  } = useSelector((state: RootState) => state.auth);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      const hasToken = authService.isAuthenticated();

      if (hasToken) {
        dispatch(initializeAuth());

        try {
          // Validate current token by getting user info
          await dispatch(getCurrentUserAsync()).unwrap();
        } catch (error) {
          // Token is invalid, clear auth state
          console.warn('Invalid token on initialization:', error);
          dispatch(logoutAsync());
        }
      }

      setIsInitialized(true);
    };

    initialize();
  }, [dispatch]);

  // Auto-refresh token mechanism
  useEffect(() => {
    if (!isAuthenticated || !refreshTokenValue) {
      return;
    }

    // Set up token refresh interval (refresh every 14 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        await dispatch(refreshTokenAsync()).unwrap();
      } catch (error) {
        console.warn('Auto token refresh failed:', error);
        // If refresh fails, logout user
        dispatch(logoutAsync());
        navigate('/auth/login');
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshTokenValue, dispatch, navigate]);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      await dispatch(loginAsync(credentials)).unwrap();

      // Get user info after successful login
      await dispatch(getCurrentUserAsync()).unwrap();

      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by Redux state
      throw error;
    }
  }, [dispatch, navigate]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await dispatch(logoutAsync()).unwrap();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }

    // Always redirect to login page
    navigate('/auth/login', { replace: true });
  }, [dispatch, navigate]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      await dispatch(refreshTokenAsync()).unwrap();
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [dispatch, logout]);

  const getCurrentUser = useCallback(async (): Promise<void> => {
    try {
      await dispatch(getCurrentUserAsync()).unwrap();
    } catch (error) {
      // If getting user fails, token might be invalid
      console.warn('Failed to get current user:', error);
      await logout();
      throw error;
    }
  }, [dispatch, logout]);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (!accessToken) {
        return false;
      }

      await dispatch(getCurrentUserAsync()).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch, accessToken]);

  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  const clearAuthError = useCallback((): void => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError: clearAuthError,

    // Helpers
    checkAuthStatus,
    hasRole,
    isInitialized
  };
};

// Additional hook for authentication guard
export const useAuthGuard = (requiredRole?: string): boolean => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return false; // Still loading
  }

  if (!isAuthenticated) {
    return false; // Not authenticated
  }

  if (requiredRole && user?.role !== requiredRole) {
    return false; // Authenticated but wrong role
  }

  return true; // Authenticated and has correct role (if specified)
};

// Hook for redirecting unauthenticated users
export const useRequireAuth = (requiredRole?: string) => {
  const navigate = useNavigate();
  const isAuthorized = useAuthGuard(requiredRole);

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/auth/login', {
        replace: true,
        state: { from: location }
      });
    }
  }, [isAuthorized, navigate]);

  return isAuthorized;
};

export default useAuth;