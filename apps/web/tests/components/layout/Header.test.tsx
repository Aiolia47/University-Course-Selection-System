import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Header from '@/components/layout/Header';
import authReducer from '@/stores/slices/authSlice';
import uiReducer from '@/stores/slices/uiSlice';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Header Component', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
      },
    });

    // Reset mocks
    mockNavigate.mockClear();
    localStorage.clear();
  });

  const renderHeader = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render without crashing', () => {
    renderHeader();
    expect(screen.getByText('BMAD7 课程选课系统')).toBeInTheDocument();
  });

  it('should display sidebar toggle button', () => {
    renderHeader();
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should toggle sidebar when toggle button is clicked', () => {
    renderHeader();

    const initialState = store.getState().ui.sidebarCollapsed;

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    const newState = store.getState().ui.sidebarCollapsed;
    expect(newState).toBe(!initialState);
  });

  it('should display user welcome message when user is authenticated', () => {
    // Mock authenticated user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    expect(screen.getByText('欢迎，Test')).toBeInTheDocument();
  });

  it('should display username when firstName is not available', () => {
    // Mock authenticated user without firstName
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: null,
          lastName: null,
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    expect(screen.getByText('欢迎，testuser')).toBeInTheDocument();
  });

  it('should display user avatar', () => {
    // Mock authenticated user with avatar
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
          avatar: 'https://example.com/avatar.jpg',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show user dropdown menu when avatar is clicked', async () => {
    // Mock authenticated user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    const avatar = screen.getByRole('button', { name: /user/i });
    fireEvent.click(avatar);

    await waitFor(() => {
      expect(screen.getByText('个人资料')).toBeInTheDocument();
      expect(screen.getByText('退出登录')).toBeInTheDocument();
    });
  });

  it('should navigate to profile when profile menu item is clicked', async () => {
    // Mock authenticated user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    // Open user menu
    const avatar = screen.getByRole('button', { name: /user/i });
    fireEvent.click(avatar);

    // Click on profile menu item
    await waitFor(() => {
      const profileItem = screen.getByText('个人资料');
      fireEvent.click(profileItem);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should logout and navigate to login when logout is clicked', async () => {
    // Mock authenticated user
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    });

    renderHeader();

    // Open user menu
    const avatar = screen.getByRole('button', { name: /user/i });
    fireEvent.click(avatar);

    // Click on logout menu item
    await waitFor(() => {
      const logoutItem = screen.getByText('退出登录');
      fireEvent.click(logoutItem);
    });

    // Check that logout action was dispatched
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
  });

  it('should show correct toggle icon based on sidebar state', () => {
    renderHeader();

    const toggleButton = screen.getByRole('button');

    // Initially sidebar should be expanded
    expect(store.getState().ui.sidebarCollapsed).toBe(false);

    // Toggle to collapse
    fireEvent.click(toggleButton);
    expect(store.getState().ui.sidebarCollapsed).toBe(true);

    // Toggle to expand
    fireEvent.click(toggleButton);
    expect(store.getState().ui.sidebarCollapsed).toBe(false);
  });
});