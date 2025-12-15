import { render, screen, fireEvent } from '../../utils/test-utils';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { store as uiStore } from '@/stores';
import uiReducer from '@/stores/slices/uiSlice';

describe('Responsive Design Behavior', () => {
  let store: ReturnType<typeof configureStore>;
  const originalInnerWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('should initialize with correct screen size on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    // Trigger window resize event
    window.dispatchEvent(new Event('resize'));

    expect(store.getState().ui.screenSize).toBe('xl');
  });

  it('should update screen size on window resize', () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
    expect(store.getState().ui.screenSize).toBe('lg');

    // Resize to tablet
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    window.dispatchEvent(resizeEvent);
    expect(store.getState().ui.screenSize).toBe('md');

    // Resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    window.dispatchEvent(resizeEvent);
    expect(store.getState().ui.screenSize).toBe('xs');
  });

  it('should auto-collapse sidebar on small screens', () => {
    // Start with expanded sidebar on desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    store.dispatch({ type: 'ui/setSidebarCollapsed', payload: false });
    expect(store.getState().ui.sidebarCollapsed).toBe(false);

    // Resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    window.dispatchEvent(new Event('resize'));
    expect(store.getState().ui.sidebarCollapsed).toBe(true);
  });

  it('should auto-collapse sidebar on extra small screens', () => {
    // Start with expanded sidebar
    store.dispatch({ type: 'ui/setSidebarCollapsed', payload: false });
    expect(store.getState().ui.sidebarCollapsed).toBe(false);

    // Resize to extra small screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    window.dispatchEvent(new Event('resize'));
    expect(store.getState().ui.screenSize).toBe('xs');
    expect(store.getState().ui.sidebarCollapsed).toBe(true);
  });

  it('should not auto-collapse sidebar on medium screens', () => {
    // Start with expanded sidebar
    store.dispatch({ type: 'ui/setSidebarCollapsed', payload: false });
    expect(store.getState().ui.sidebarCollapsed).toBe(false);

    // Resize to medium screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    window.dispatchEvent(new Event('resize'));
    expect(store.getState().ui.screenSize).toBe('md');
    // Sidebar should remain expanded on medium screens
    expect(store.getState().ui.sidebarCollapsed).toBe(false);
  });

  it('should test all breakpoint transitions', () => {
    const testCases = [
      { width: 320, expected: 'xs', description: 'Extra Small' },
      { width: 480, expected: 'xs', description: 'Small Mobile' },
      { width: 576, expected: 'sm', description: 'Mobile' },
      { width: 768, expected: 'md', description: 'Tablet' },
      { width: 992, expected: 'lg', description: 'Desktop' },
      { width: 1200, expected: 'xl', description: 'Large Desktop' },
      { width: 1400, expected: 'xxl', description: 'Extra Large' },
    ];

    testCases.forEach(({ width, expected, description }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });

      window.dispatchEvent(new Event('resize'));
      expect(store.getState().ui.screenSize).toBe(expected);
    });
  });

  it('should handle rapid window resizes', () => {
    // Rapid resize simulation
    const widths = [1200, 800, 480, 1200];
    const expected = ['xl', 'md', 'xs', 'xl'];

    widths.forEach((width, index) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });

      window.dispatchEvent(new Event('resize'));
      expect(store.getState().ui.screenSize).toBe(expected[index]);
    });
  });

  it('should maintain manual sidebar collapse state across resizes', () => {
    // Manually collapse sidebar on desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    window.dispatchEvent(new Event('resize'));
    store.dispatch({ type: 'ui/toggleSidebar' });
    expect(store.getState().ui.sidebarCollapsed).toBe(true);

    // Resize to tablet and back
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    window.dispatchEvent(new Event('resize'));
    expect(store.getState().ui.sidebarCollapsed).toBe(true);

    // Resize back to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    window.dispatchEvent(new Event('resize'));
    // Should remain collapsed (manually set state)
    expect(store.getState().ui.sidebarCollapsed).toBe(true);
  });
});