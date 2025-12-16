import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedComponentProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  roles?: string[];
  requireAll?: boolean;
}

/**
 * Component that renders children only if user has the required permission
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  resource,
  action,
  fallback = null,
  roles = [],
  requireAll = false,
}) => {
  const { hasPermission, hasRole } = usePermissions();

  // Check role requirements if specified
  if (roles.length > 0) {
    const hasRequiredRole = requireAll
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface PermissionWrapperProps {
  children: React.ReactNode;
  permissions: Array<{
    resource: string;
    action: string;
  }>;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Component that renders children only if user has any or all of the specified permissions
 */
export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permissions,
  fallback = null,
  requireAll = false,
}) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasRequiredPermissions = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
};

interface RoleWrapperProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Component that renders children only if user has any or all of the specified roles
 */
export const RoleWrapper: React.FC<RoleWrapperProps> = ({
  children,
  roles,
  fallback = null,
  requireAll = false,
}) => {
  const { hasRole } = usePermissions();

  const hasRequiredRoles = requireAll
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role));

  return hasRequiredRoles ? <>{children}</> : <>{fallback}</>;
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = (
  resource: string,
  action: string,
  fallback?: React.ReactNode
) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithPermissionComponent: React.FC<P> = (props) => {
      return (
        <ProtectedComponent resource={resource} action={action} fallback={fallback}>
          <WrappedComponent {...props} />
        </ProtectedComponent>
      );
    };

    WithPermissionComponent.displayName = `withPermission(${resource}:${action})`;
    return WithPermissionComponent;
  };
};

/**
 * Higher-order component for role-based rendering
 */
export const withRole = (
  roles: string[],
  fallback?: React.ReactNode,
  requireAll: boolean = false
) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithRoleComponent: React.FC<P> = (props) => {
      return (
        <RoleWrapper roles={roles} fallback={fallback} requireAll={requireAll}>
          <WrappedComponent {...props} />
        </RoleWrapper>
      );
    };

    WithRoleComponent.displayName = `withRole(${roles.join(',')})`;
    return WithRoleComponent;
  };
};

// Common permission wrappers for convenience
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <RoleWrapper roles={['admin']} fallback={fallback}>
      {children}
    </RoleWrapper>
  );
};

export const StudentOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <RoleWrapper roles={['student']} fallback={fallback}>
      {children}
    </RoleWrapper>
  );
};

export const AdminOrStudent: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <RoleWrapper roles={['admin', 'student']} fallback={fallback}>
      {children}
    </RoleWrapper>
  );
};

// Common permission-based wrappers
export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <ProtectedComponent resource="user" action="manage" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
};

export const CanManageCourses: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <ProtectedComponent resource="course" action="manage" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
};

export const CanManageSelections: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <ProtectedComponent resource="selection" action="manage" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
};

export const CanManagePermissions: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <ProtectedComponent resource="permission" action="assign" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
};

export default ProtectedComponent;