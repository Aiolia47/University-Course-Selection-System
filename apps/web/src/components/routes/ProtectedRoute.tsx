import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/rootReducer';
import { authService } from '../../services/authService';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'admin';
  requiredRoles?: ('student' | 'admin')[];
  fallbackPath?: string;
  unauthorizedPath?: string;
  showLoading?: boolean;
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  fallbackPath = '/auth/login',
  unauthorizedPath = '/unauthorized',
  showLoading = true
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      setIsValidating(true);

      // First check if there's a token
      if (!authService.isAuthenticated()) {
        navigate(fallbackPath, {
          replace: true,
          state: { from: location }
        });
        setIsValidating(false);
        return;
      }

      // Check if we need to validate the current user
      if (!isAuthenticated || !user) {
        try {
          // The auth state might not be initialized yet, give it a moment
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Auth validation failed:', error);
        }

        // Re-check after waiting
        const currentState = (window as any).__REDUX_STORE__?.getState();
        const currentAuth = currentState?.auth;

        if (!currentAuth?.isAuthenticated || !currentAuth?.user) {
          navigate(fallbackPath, {
            replace: true,
            state: { from: location }
          });
          setIsValidating(false);
          return;
        }
      }

      // Check role requirements
      const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : []);

      if (rolesToCheck.length > 0 && !rolesToCheck.includes(user?.role as any)) {
        navigate(unauthorizedPath, {
          replace: true
        });
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
    };

    validateAuth();
  }, [
    isAuthenticated,
    user,
    requiredRole,
    requiredRoles,
    navigate,
    location,
    fallbackPath,
    unauthorizedPath
  ]);

  // Show loading while validating auth state
  if (isValidating || isLoading) {
    if (showLoading) {
      return (
        <div className={styles.loadingContainer}>
          <Spin size="large" tip="验证身份中..." />
        </div>
      );
    }
    return null;
  }

  // Check authentication
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Check role requirements
  const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : []);

  if (rolesToCheck.length > 0 && !rolesToCheck.includes(user?.role as any)) {
    return null; // Will redirect to unauthorized
  }

  return <>{children}</>;
};

export default ProtectedRoute;