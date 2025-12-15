import { render, screen } from '../../utils/test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import ProtectedRoute from '@/components/routes/ProtectedRoute';
import authReducer from '@/stores/slices/authSlice';

describe('ProtectedRoute Component', () => {
  let store: ReturnType<typeof configureStore>;
  let history: ReturnType<typeof createMemoryHistory>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Create a fresh history
    history = createMemoryHistory();

    // Clear localStorage
    localStorage.clear();
  });

  const renderProtectedRoute = (
    children: React.ReactNode,
    requiredRole?: 'student' | 'admin',
    fallbackPath?: string
  ) => {
    return render(
      <Provider store={store}>
        <Router location={history.location} navigator={history}>
          <ProtectedRoute
            requiredRole={requiredRole}
            fallbackPath={fallbackPath}
          >
            {children}
          </ProtectedRoute>
        </Router>
      </Provider>
    );
  };

  it('should render children when user is authenticated', () => {
    // Mock authenticated user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent);

    // Should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Should redirect to login
    expect(history.location.pathname).toBe('/auth/login');
    expect(history.location.state).toEqual({ from: '/' });
  });

  it('should use custom fallback path', () => {
    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent, undefined, '/custom-login');

    // Should redirect to custom fallback path
    expect(history.location.pathname).toBe('/custom-login');
  });

  it('should render children when user has required role', () => {
    // Mock authenticated admin user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'admin',
          role: 'admin',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="admin-content">Admin Content</div>;
    renderProtectedRoute(testContent, 'admin');

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('should redirect when user does not have required role', () => {
    // Mock authenticated student user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'student',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="admin-content">Admin Content</div>;
    renderProtectedRoute(testContent, 'admin');

    // Should not render the protected content
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();

    // Should redirect to unauthorized page
    expect(history.location.pathname).toBe('/unauthorized');
  });

  it('should render children for student role when required', () => {
    // Mock authenticated student user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'student',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="student-content">Student Content</div>;
    renderProtectedRoute(testContent, 'student');

    expect(screen.getByTestId('student-content')).toBeInTheDocument();
  });

  it('should render children when no role is required', () => {
    // Mock authenticated user with any role
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'user',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="any-role-content">Any Role Content</div>;
    renderProtectedRoute(testContent);

    expect(screen.getByTestId('any-role-content')).toBeInTheDocument();
  });

  it('should preserve the original path in redirect state', () => {
    // Navigate to a protected route
    history.push('/dashboard');

    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent);

    // Should redirect to login with the original path
    expect(history.location.pathname).toBe('/auth/login');
    expect(history.location.state).toEqual({ from: '/dashboard' });
  });

  it('should handle null user gracefully', () => {
    // Mock authentication state with null user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: null,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent, 'student');

    // Should not render content when user is null
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should handle undefined user role gracefully', () => {
    // Mock authentication state with user without role
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          role: undefined,
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    const testContent = <div data-testid="protected-content">Protected Content</div>;
    renderProtectedRoute(testContent, 'student');

    // Should not render content when role doesn't match
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});