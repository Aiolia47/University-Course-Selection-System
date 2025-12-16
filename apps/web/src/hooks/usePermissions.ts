import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useCallback, useMemo } from 'react';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: any;
}

export interface RolePermission {
  role: string;
  permissions: Permission[];
  totalPermissions: number;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface UsePermissionsResult {
  // Current user permissions
  userPermissions: Permission[];
  userRole: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Permission checking methods
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (checks: PermissionCheck[]) => boolean;
  hasAllPermissions: (checks: PermissionCheck[]) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;

  // Permission-based component rendering
  canAccess: (resource: string, action: string) => boolean;
  canPerformAction: (checks: PermissionCheck[]) => boolean;
}

export const usePermissions = (): UsePermissionsResult => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  // Memoize user role for performance
  const userRole = useMemo(() => user?.role || null, [user?.role]);

  // Default permissions based on user role (fallback if API permissions not loaded)
  const defaultPermissions = useMemo((): Permission[] => {
    if (!userRole) return [];

    switch (userRole) {
      case 'admin':
        return [
          // User management
          { id: 'user-create', name: 'user.create', description: '创建用户', resource: 'user', action: 'create' },
          { id: 'user-read', name: 'user.read', description: '查看用户信息', resource: 'user', action: 'read' },
          { id: 'user-update', name: 'user.update', description: '更新用户信息', resource: 'user', action: 'update' },
          { id: 'user-delete', name: 'user.delete', description: '删除用户', resource: 'user', action: 'delete' },
          { id: 'user-list', name: 'user.list', description: '列出用户', resource: 'user', action: 'list' },
          { id: 'user-manage', name: 'user.manage', description: '管理用户账户', resource: 'user', action: 'manage' },

          // Course management
          { id: 'course-create', name: 'course.create', description: '创建课程', resource: 'course', action: 'create' },
          { id: 'course-read', name: 'course.read', description: '查看课程信息', resource: 'course', action: 'read' },
          { id: 'course-update', name: 'course.update', description: '更新课程信息', resource: 'course', action: 'update' },
          { id: 'course-delete', name: 'course.delete', description: '删除课程', resource: 'course', action: 'delete' },
          { id: 'course-list', name: 'course.list', description: '列出课程', resource: 'course', action: 'list' },
          { id: 'course-manage', name: 'course.manage', description: '管理课程', resource: 'course', action: 'manage' },

          // Selection management
          { id: 'selection-read', name: 'selection.read', description: '查看选课记录', resource: 'selection', action: 'read' },
          { id: 'selection-list', name: 'selection.list', description: '列出选课记录', resource: 'selection', action: 'list' },
          { id: 'selection-manage', name: 'selection.manage', description: '管理选课记录', resource: 'selection', action: 'manage' },

          // Permission management
          { id: 'permission-read', name: 'permission.read', description: '查看权限信息', resource: 'permission', action: 'read' },
          { id: 'permission-list', name: 'permission.list', description: '列出权限', resource: 'permission', action: 'list' },
          { id: 'permission-assign', name: 'permission.assign', description: '分配权限', resource: 'permission', action: 'assign' },
          { id: 'permission-revoke', name: 'permission.revoke', description: '撤销权限', resource: 'permission', action: 'revoke' },

          // Role management
          { id: 'role-read', name: 'role.read', description: '查看角色信息', resource: 'role', action: 'read' },
          { id: 'role-list', name: 'role.list', description: '列出角色', resource: 'role', action: 'list' },
          { id: 'role-manage', name: 'role.manage', description: '管理角色', resource: 'role', action: 'manage' },

          // System management
          { id: 'system-read', name: 'system.read', description: '查看系统信息', resource: 'system', action: 'read' },
          { id: 'system-manage', name: 'system.manage', description: '管理系统', resource: 'system', action: 'manage' },
        ];

      case 'student':
        return [
          // Course access
          { id: 'course-read', name: 'course.read', description: '查看课程信息', resource: 'course', action: 'read' },
          { id: 'course-list', name: 'course.list', description: '列出课程', resource: 'course', action: 'list' },

          // Selection management
          { id: 'selection-create', name: 'selection.create', description: '创建选课记录', resource: 'selection', action: 'create' },
          { id: 'selection-read-own', name: 'selection.read.own', description: '查看自己的选课记录', resource: 'selection', action: 'read' },
          { id: 'selection-update-own', name: 'selection.update.own', description: '更新自己的选课记录', resource: 'selection', action: 'update' },
          { id: 'selection-delete-own', name: 'selection.delete.own', description: '删除自己的选课记录', resource: 'selection', action: 'delete' },

          // User self-management
          { id: 'user-read-own', name: 'user.read.own', description: '查看自己的用户信息', resource: 'user', action: 'read' },
          { id: 'user-update-own', name: 'user.update.own', description: '更新自己的用户信息', resource: 'user', action: 'update' },
        ];

      default:
        return [];
    }
  }, [userRole]);

  // For now, use default permissions. In a real app, you might fetch from API
  const userPermissions = defaultPermissions;

  // Check if user has a specific permission
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!isAuthenticated || !userPermissions.length) {
      return false;
    }

    // Check for exact match
    const hasExactPermission = userPermissions.some(
      permission => permission.resource === resource && permission.action === action
    );

    if (hasExactPermission) {
      return true;
    }

    // Check for wildcard permissions
    const hasWildcardPermission = userPermissions.some(
      permission => permission.resource === resource && permission.action === '*'
    );

    return hasWildcardPermission;
  }, [isAuthenticated, userPermissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((checks: PermissionCheck[]): boolean => {
    return checks.some(check => hasPermission(check.resource, check.action));
  }, [hasPermission]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((checks: PermissionCheck[]): boolean => {
    return checks.every(check => hasPermission(check.resource, check.action));
  }, [hasPermission]);

  // Check if user has a specific role
  const hasRole = useCallback((role: string): boolean => {
    return userRole === role;
  }, [userRole]);

  // Convenience methods for common role checks
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isStudent = useCallback((): boolean => {
    return hasRole('student');
  }, [hasRole]);

  // Convenience method for component access control
  const canAccess = useCallback((resource: string, action: string): boolean => {
    return hasPermission(resource, action);
  }, [hasPermission]);

  // Convenience method for action-based access control
  const canPerformAction = useCallback((checks: PermissionCheck[]): boolean => {
    return hasAnyPermission(checks);
  }, [hasAnyPermission]);

  return {
    userPermissions,
    userRole,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isStudent,
    canAccess,
    canPerformAction,
  };
};