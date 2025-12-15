import { createBrowserRouter, Navigate, lazy, Suspense } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/routes/ProtectedRoute';
import ErrorBoundary from '@/components/routes/ErrorBoundary';
import { Spin } from 'antd';

// Loading component for lazy loaded routes
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px'
  }}>
    <Spin size="large" />
  </div>
);

// Lazy load page components for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const CoursesPage = lazy(() => import('@/pages/courses/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/courses/CourseDetailPage'));
const SelectionsPage = lazy(() => import('@/pages/selections/SelectionsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Wrap lazy components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: withSuspense(LoginPage),
      },
      {
        path: 'register',
        element: withSuspense(RegisterPage),
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: withSuspense(DashboardPage),
      },
      {
        path: 'courses',
        children: [
          {
            index: true,
            element: withSuspense(CoursesPage),
          },
          {
            path: ':courseId',
            element: withSuspense(CourseDetailPage),
          },
        ],
      },
      {
        path: 'selections',
        element: withSuspense(SelectionsPage),
      },
      {
        path: 'profile',
        element: withSuspense(ProfilePage),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);