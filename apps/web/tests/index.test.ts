// Test suite entry point for all frontend framework tests
// This file serves as a test suite index and can be used to run specific test groups

// Import test utilities
import './utils/test-utils';

// Import all component tests
import './components/layout/Header.test';
import './components/layout/MainLayout.test';
import './components/layout/Sidebar.test';
import './components/layout/Footer.test';
import './components/routes/ProtectedRoute.test';
import './components/routes/ErrorBoundary.test';

// Import store tests
import './stores/authSlice.test';
import './stores/uiSlice.test';

// Import service tests
import './services/api.test';

// Import route tests
import './routes/router.test';

// Import responsive tests
import './responsive/responsive.test';

// Export test groups for potential selective testing
export const TestGroups = {
  Components: {
    Header: './components/layout/Header.test',
    MainLayout: './components/layout/MainLayout.test',
    Sidebar: './components/layout/Sidebar.test',
    Footer: './components/layout/Footer.test',
    ProtectedRoute: './components/routes/ProtectedRoute.test',
    ErrorBoundary: './components/routes/ErrorBoundary.test',
  },
  Store: {
    AuthSlice: './stores/authSlice.test',
    UISlice: './stores/uiSlice.test',
  },
  Services: {
    API: './services/api.test',
  },
  Routing: {
    Router: './routes/router.test',
  },
  Responsive: {
    ResponsiveDesign: './responsive/responsive.test',
  },
};