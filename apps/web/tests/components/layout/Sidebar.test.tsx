import { render, screen, fireEvent } from '../../utils/test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import uiReducer from '@/stores/slices/uiSlice';
import authReducer from '@/stores/slices/authSlice';

// Mock Ant Design components
jest.mock('antd', () => ({
  Layout: {
    Sider: ({ children, collapsed, width, collapsedWidth }: any) => (
      <div
        data-testid="sidebar"
        data-collapsed={collapsed}
        data-width={width}
        data-collapsed-width={collapsedWidth}
      >
        {children}
      </div>
    ),
  },
  Menu: {
    Item: ({ children, icon }: any) => (
      <div data-testid="menu-item">
        {icon}
        <span>{children}</span>
      </div>
    ),
    SubMenu: ({ children, icon, title }: any) => (
      <div data-testid="submenu">
        {icon}
        <span>{title}</span>
        {children}
      </div>
    ),
  },
}));

// Mock icons
jest.mock('@ant-design/icons', () => ({
  DashboardOutlined: () => <span data-testid="dashboard-icon">Dashboard</span>,
  BookOutlined: () => <span data-testid="book-icon">Book</span>,
  SettingOutlined: () => <span data-testid="setting-icon">Setting</span>,
  MenuFoldOutlined: () => <span data-testid="menu-fold-icon">Fold</span>,
}));

describe('Sidebar Component', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        ui: uiReducer,
        auth: authReducer,
      },
    });
  });

  const renderSidebar = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should render without crashing', () => {
    renderSidebar();

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should use correct width and collapsed width', () => {
    renderSidebar();

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-width', '256');
    expect(sidebar).toHaveAttribute('data-collapsed-width', '80');
  });

  it('should reflect collapsed state from store', () => {
    renderSidebar();

    const sidebar = screen.getByTestId('sidebar');

    // Initially expanded
    expect(store.getState().ui.sidebarCollapsed).toBe(false);
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    // Toggle to collapsed
    store.dispatch({ type: 'ui/toggleSidebar' });

    // Check that sidebar reflects new state
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('should render navigation menu items', () => {
    renderSidebar();

    // Check for dashboard menu item
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByText('仪表板')).toBeInTheDocument();

    // Check for courses menu item
    expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    expect(screen.getByText('课程管理')).toBeInTheDocument();
  });

  it('should render settings submenu', () => {
    renderSidebar();

    expect(screen.getByTestId('submenu')).toBeInTheDocument();
    expect(screen.getByTestId('setting-icon')).toBeInTheDocument();
    expect(screen.getByText('系统设置')).toBeInTheDocument();
  });

  it('should handle menu item clicks', () => {
    renderSidebar();

    const menuItems = screen.getAllByTestId('menu-item');

    // Click on dashboard menu item
    fireEvent.click(menuItems[0]);

    // The component should handle navigation (we're just testing it doesn't crash)
    expect(menuItems[0]).toBeInTheDocument();
  });

  it('should adapt to screen size changes', () => {
    // Set initial screen size to mobile
    store.dispatch({ type: 'ui/setScreenSize', payload: 'xs' });

    renderSidebar();

    const sidebar = screen.getByTestId('sidebar');

    // Should be collapsed on mobile
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');

    // Change to desktop size
    store.dispatch({ type: 'ui/setScreenSize', payload: 'lg' });

    // Sidebar should still respect the collapsed state from mobile
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });
});