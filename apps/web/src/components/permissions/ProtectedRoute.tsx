import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Alert, Button } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource?: string;
  action?: string;
  roles?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Route protection component that checks permissions before rendering children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  resource,
  action,
  roles = [],
  requireAll = false,
  redirectTo = '/unauthorized',
  fallbackComponent,
  showAccessDenied = true,
}) => {
  const location = useLocation();
  const { hasPermission, hasRole, isAuthenticated } = usePermissions();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role requirements if specified
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      if (fallbackComponent) {
        return <>{fallbackComponent}</>;
      }

      if (redirectTo) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
      }

      if (showAccessDenied) {
        return (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <Alert
              message="访问被拒绝"
              description={`您需要以下角色之一才能访问此页面: ${roles.join(', ')}`}
              type="error"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </div>
        );
      }

      return null;
    }
  }

  // Check permission requirements if specified
  if (resource && action) {
    if (!hasPermission(resource, action)) {
      if (fallbackComponent) {
        return <>{fallbackComponent}</>;
      }

      if (redirectTo) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
      }

      if (showAccessDenied) {
        return (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <Alert
              message="访问被拒绝"
              description={`您需要 ${resource}:${action} 权限才能访问此页面`}
              type="error"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </div>
        );
      }

      return null;
    }
  }

  return <>{children}</>;
};

/**
 * Hook for creating route guards with specific permissions
 */
export const useProtectedRoute = (
  resource?: string,
  action?: string,
  roles?: string[],
  requireAll: boolean = false
) => {
  const { hasPermission, hasRole, isAuthenticated } = usePermissions();

  const canAccess = React.useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }

    // Check role requirements if specified
    if (roles && roles.length > 0) {
      const hasRequiredRole = requireAll
        ? roles.every(role => hasRole(role))
        : roles.some(role => hasRole(role));

      if (!hasRequiredRole) {
        return false;
      }
    }

    // Check permission requirements if specified
    if (resource && action) {
      return hasPermission(resource, action);
    }

    return true;
  }, [isAuthenticated, hasPermission, hasRole, resource, action, roles, requireAll]);

  return { canAccess };
};

/**
 * Higher-order component for protecting routes
 */
export const withRouteProtection = (
  resource?: string,
  action?: string,
  roles?: string[],
  requireAll: boolean = false,
  redirectTo?: string
) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithRouteProtectionComponent: React.FC<P> = (props) => {
      return (
        <ProtectedRoute
          resource={resource}
          action={action}
          roles={roles}
          requireAll={requireAll}
          redirectTo={redirectTo}
        >
          <WrappedComponent {...props} />
        </ProtectedRoute>
      );
    };

    WithRouteProtectionComponent.displayName = `withRouteProtection(${resource}:${action})`;
    return WithRouteProtectionComponent;
  };
};

// Common route protection components
export const AdminRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute roles={['admin']} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export const StudentRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute roles={['student']} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export const AdminOrStudentRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute roles={['admin', 'student']} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export const UserManagementRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute resource="user" action="manage" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export const CourseManagementRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute resource="course" action="manage" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export const PermissionManagementRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({
  children,
  redirectTo,
}) => {
  return (
    <ProtectedRoute resource="permission" action="assign" redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;