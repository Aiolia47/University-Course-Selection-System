import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { router } from '@/routes';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/stores';
import { Provider } from 'react-redux';

// Mock the pages to avoid loading actual components
jest.mock('@/pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

jest.mock('@/pages/auth/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

jest.mock('@/pages/auth/RegisterPage', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}));

jest.mock('@/pages/dashboard/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

jest.mock('@/pages/courses/CoursesPage', () => ({
  default: () => <div data-testid="courses-page">Courses Page</div>
}));

jest.mock('@/pages/courses/CourseDetailPage', () => ({
  default: () => <div data-testid="course-detail-page">Course Detail Page</div>
}));

jest.mock('@/pages/selections/SelectionsPage', () => ({
  default: () => <div data-testid="selections-page">Selections Page</div>
}));

jest.mock('@/pages/profile/ProfilePage', () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>
}));

jest.mock('@/pages/NotFoundPage', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}));

jest.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">
      <div data-testid="layout-content">{children}</div>
    </div>
  )
}));

jest.mock('@/components/routes/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  )
}));

jest.mock('@/components/routes/ErrorBoundary', () => ({
  default: () => <div data-testid="error-boundary">Error Boundary</div>
}));

describe('Router Configuration', () => {
  const renderWithRouter = () => {
    return render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    );
  };

  beforeEach(() => {
    // Reset authentication state
    store.dispatch({ type: 'auth/logout' });
    localStorage.clear();
  });

  it('should redirect to dashboard from root path', () => {
    renderWithRouter();
    // Root path "/" should redirect to "/dashboard"
    expect(screen.queryByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('should render login page for /auth/login route', async () => {
    renderWithRouter();

    // Navigate to login page
    window.history.pushState({}, 'Test', '/auth/login');

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('should render register page for /auth/register route', async () => {
    renderWithRouter();

    // Navigate to register page
    window.history.pushState({}, 'Test', '/auth/register');

    await waitFor(() => {
      expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });
  });

  it('should render dashboard page for /dashboard route', async () => {
    // Mock authentication
    localStorage.setItem('token', 'mock-token');
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: '1', username: 'test', role: 'student' },
        token: 'mock-token',
        refreshToken: 'refresh-token'
      }
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  it('should render courses page for /courses route', async () => {
    // Mock authentication
    localStorage.setItem('token', 'mock-token');
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: '1', username: 'test', role: 'student' },
        token: 'mock-token',
        refreshToken: 'refresh-token'
      }
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('courses-page')).toBeInTheDocument();
    });
  });

  it('should render course detail page for /courses/:courseId route', async () => {
    // Mock authentication
    localStorage.setItem('token', 'mock-token');
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: '1', username: 'test', role: 'student' },
        token: 'mock-token',
        refreshToken: 'refresh-token'
      }
    });

    renderWithRouter();

    // Navigate to course detail page
    window.history.pushState({}, 'Test', '/courses/123');

    await waitFor(() => {
      expect(screen.getByTestId('course-detail-page')).toBeInTheDocument();
    });
  });

  it('should render selections page for /selections route', async () => {
    // Mock authentication
    localStorage.setItem('token', 'mock-token');
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: '1', username: 'test', role: 'student' },
        token: 'mock-token',
        refreshToken: 'refresh-token'
      }
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('selections-page')).toBeInTheDocument();
    });
  });

  it('should render profile page for /profile route', async () => {
    // Mock authentication
    localStorage.setItem('token', 'mock-token');
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: { id: '1', username: 'test', role: 'student' },
        token: 'mock-token',
        refreshToken: 'refresh-token'
      }
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });
  });

  it('should render 404 page for unknown routes', async () => {
    renderWithRouter();

    // Navigate to unknown route
    window.history.pushState({}, 'Test', '/unknown-route');

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });
});