import { RouteObject } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';
import SelectionsPage from '@/pages/selections/SelectionsPage';
import ProfilePage from '@/pages/profile/ProfilePage';

// Admin-specific pages can be added here
// import AdminUsersPage from '@/pages/admin/AdminUsersPage';
// import AdminReportsPage from '@/pages/admin/AdminReportsPage';

export const adminRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/courses',
    children: [
      {
        index: true,
        element: <CoursesPage />,
      },
      {
        path: ':courseId',
        element: <CourseDetailPage />,
      },
    ],
  },
  {
    path: '/selections',
    element: <SelectionsPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  // Admin-only routes can be added here
  // {
  //   path: '/admin/users',
  //   element: <AdminUsersPage />,
  // },
  // {
  //   path: '/admin/reports',
  //   element: <AdminReportsPage />,
  // },
];