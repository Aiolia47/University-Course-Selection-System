import { User } from '@/types/auth';

/**
 * Simple permission checking utility function
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) {
    return false;
  }

  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Check specific permissions based on user role
  const adminPermissions = [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.list',
    'user.manage',
    'course.create',
    'course.read',
    'course.update',
    'course.delete',
    'course.list',
    'course.manage',
    'course.batch',
    'selection.read',
    'selection.list',
    'selection.manage',
    'permission.read',
    'permission.list',
    'permission.assign',
    'permission.revoke',
    'role.read',
    'role.list',
    'role.manage',
    'system.read',
    'system.manage'
  ];

  const studentPermissions = [
    'course.read',
    'course.list',
    'selection.create',
    'selection.read.own',
    'selection.update.own',
    'selection.delete.own',
    'user.read.own',
    'user.update.own'
  ];

  // Get permissions for the user's role
  const rolePermissions = user.role === 'admin' ? adminPermissions :
                         user.role === 'student' ? studentPermissions : [];

  // Check for exact permission match
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., 'course.*')
  const [resource, action] = permission.split('.');
  const wildcardPermission = `${resource}.*`;
  if (rolePermissions.includes(wildcardPermission)) {
    return true;
  }

  return false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) {
    return false;
  }

  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) {
    return false;
  }

  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.role === role;
};

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Check if user is a student
 */
export const isStudent = (user: User | null): boolean => {
  return hasRole(user, 'student');
};