import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import uiReducer from '@/stores/slices/uiSlice';

// Mock the Outlet component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet-content">Page Content</div>,
}));

// Mock layout components
jest.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('MainLayout Component', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Clear all resize event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  const renderMainLayout = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<MainLayout />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  it('should render without crashing', () => {
    renderMainLayout();

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('should have correct minimum height', () => {
    renderMainLayout();

    const mainLayout = screen.getByTestId('main-layout');
    expect(mainLayout).toHaveStyle({ minHeight: '100vh' });
  });

  it('should adjust margin based on sidebar collapsed state', () => {
    renderMainLayout();

    const layoutContent = screen.getByTestId('layout-content');

    // Initially sidebar should be expanded
    expect(store.getState().ui.sidebarCollapsed).toBe(false);
    expect(layoutContent).toHaveStyle({ marginLeft: '256px' });

    // Toggle sidebar to collapsed
    store.dispatch({ type: 'ui/toggleSidebar' });

    // Check that margin is adjusted
    expect(layoutContent).toHaveStyle({ marginLeft: '80px' });
  });

  it('should handle window resize events', () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();

    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
    });

    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
    });

    renderMainLayout();

    // Check that resize listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should update screen size on window resize', () => {
    let resizeCallback: ((e: UIEvent) => void) | undefined;

    // Mock addEventListener to capture the callback
    Object.defineProperty(window, 'addEventListener', {
      value: (event: string, callback: EventListener) => {
        if (event === 'resize') {
          resizeCallback = callback as (e: UIEvent) => void;
        }
      },
    });

    renderMainLayout();

    // Simulate window resize to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    // Trigger resize event
    if (resizeCallback) {
      resizeCallback(new UIEvent('resize'));
    }

    // Check that screen size was updated
    expect(store.getState().ui.screenSize).toBe('xs');
  });

  it('should set correct screen size for different breakpoints', () => {
    let resizeCallback: ((e: UIEvent) => void) | undefined;

    Object.defineProperty(window, 'addEventListener', {
      value: (event: string, callback: EventListener) => {
        if (event === 'resize') {
          resizeCallback = callback as (e: UIEvent) => void;
        }
      },
    });

    renderMainLayout();

    const testCases = [
      { width: 480, expected: 'xs' },
      { width: 576, expected: 'sm' },
      { width: 768, expected: 'md' },
      { width: 992, expected: 'lg' },
      { width: 1200, expected: 'xl' },
      { width: 1400, expected: 'xxl' },
    ];

    testCases.forEach(({ width, expected }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });

      if (resizeCallback) {
        resizeCallback(new UIEvent('resize'));
      }

      expect(store.getState().ui.screenSize).toBe(expected);
    });
  });

  it('should auto-collapse sidebar on small screens', () => {
    let resizeCallback: ((e: UIEvent) => void) | undefined;

    Object.defineProperty(window, 'addEventListener', {
      value: (event: string, callback: EventListener) => {
        if (event === 'resize') {
          resizeCallback = callback as (e: UIEvent) => void;
        }
      },
    });

    renderMainLayout();

    // Start with expanded sidebar
    store.dispatch({ type: 'ui/setSidebarCollapsed', payload: false });
    expect(store.getState().ui.sidebarCollapsed).toBe(false);

    // Resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    if (resizeCallback) {
      resizeCallback(new UIEvent('resize'));
    }

    // Sidebar should be auto-collapsed
    expect(store.getState().ui.sidebarCollapsed).toBe(true);
  });

  it('should clean up resize event listener on unmount', () => {
    const mockRemoveEventListener = jest.fn();

    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
    });

    const { unmount } = renderMainLayout();

    unmount();

    // Check that resize listener was removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});