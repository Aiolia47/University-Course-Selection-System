import { RouteObject } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';
import SelectionsPage from '@/pages/selections/SelectionsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import CourseManagement from '@/pages/admin/CourseManagement';
import PermissionManagement from '@/pages/admin/PermissionManagement';

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
  // Admin-only routes
  {
    path: '/admin/courses',
    element: <CourseManagement />,
  },
  {
    path: '/admin/permissions',
    element: <PermissionManagement />,
  },
];