import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'admin';
  fallbackPath?: string;
}

const ProtectedRoute = ({
  children,
  requiredRole,
  fallbackPath = '/auth/login'
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page with return url
      navigate(fallbackPath, {
        state: { from: location.pathname }
      });
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // User is authenticated but doesn't have the required role
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, requiredRole, navigate, location.pathname, fallbackPath]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null; // Will redirect to unauthorized
  }

  return <>{children}</>;
};

export default ProtectedRoute;