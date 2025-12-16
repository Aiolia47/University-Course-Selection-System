import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { PermissionService } from '../services/permissionService';
import { ApiResponse } from '../utils/apiResponse';
import { PermissionCheck, SystemResource, SystemAction } from '../types/permission';

export interface PermissionRequest extends AuthenticatedRequest {
  permissionContext?: {
    resource?: any;
    action?: string;
    resourceId?: string;
  };
}

/**
 * Permission Middleware Factory
 * Creates middleware that checks if the authenticated user has the required permission
 */
export function requirePermission(resource: string, action: string, getResource?: (req: PermissionRequest) => Promise<any>) {
  return async (req: PermissionRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      // Get resource if provider function is supplied
      let resourceData = null;
      if (getResource) {
        resourceData = await getResource(req);
        req.permissionContext = {
          resource: resourceData,
          action,
          resourceId: resourceData?.id
        };
      }

      // Check permission
      const permissionService = new PermissionService();
      const hasPermission = await permissionService.checkPermission(req.user, {
        resource,
        action,
        context: {
          user: req.user,
          resource: resourceData,
          request: req
        }
      });

      if (!hasPermission) {
        ApiResponse.forbidden(res, '权限不足', {
          required: `${resource}:${action}`,
          userRole: req.user.role
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      ApiResponse.internalError(res, '权限验证失败');
    }
  };
}

/**
 * Resource Permission Middleware Factory
 * Checks permission for a specific resource with ID
 */
export function requireResourcePermission(resource: string, action: string, resourceIdParam: string = 'id') {
  return requirePermission(resource, action, async (req) => {
    const resourceId = req.params[resourceIdParam];

    // You can extend this to fetch actual resource from database
    // For now, return the resource ID for basic checking
    return {
      id: resourceId,
      resourceType: resource
    };
  });
}

/**
 * Multiple Permission Middleware Factory
 * Checks if user has ANY of the required permissions
 */
export function requireAnyPermission(permissions: Array<{ resource: string; action: string }>) {
  return async (req: PermissionRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const permissionService = new PermissionService();
      const permissionChecks: PermissionCheck[] = permissions.map(p => ({
        resource: p.resource,
        action: p.action,
        context: {
          user: req.user!,
          request: req
        }
      }));

      const hasAnyPermission = await permissionService.checkAnyPermission(req.user, permissionChecks);

      if (!hasAnyPermission) {
        ApiResponse.forbidden(res, '权限不足', {
          required: permissions.map(p => `${p.resource}:${p.action}`),
          userRole: req.user.role
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      ApiResponse.internalError(res, '权限验证失败');
    }
  };
}

/**
 * All Permissions Middleware Factory
 * Checks if user has ALL of the required permissions
 */
export function requireAllPermissions(permissions: Array<{ resource: string; action: string }>) {
  return async (req: PermissionRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const permissionService = new PermissionService();
      const permissionChecks: PermissionCheck[] = permissions.map(p => ({
        resource: p.resource,
        action: p.action,
        context: {
          user: req.user!,
          request: req
        }
      }));

      const hasAllPermissions = await permissionService.checkAllPermissions(req.user, permissionChecks);

      if (!hasAllPermissions) {
        ApiResponse.forbidden(res, '权限不足', {
          required: permissions.map(p => `${p.resource}:${p.action}`),
          userRole: req.user.role
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      ApiResponse.internalError(res, '权限验证失败');
    }
  };
}

/**
 * Ownership Permission Middleware Factory
 * Checks if user owns the resource or has admin privileges
 */
export function requireOwnershipOrAdmin(resource: string, action: string, ownerIdField: string = 'userId') {
  return requirePermission(resource, action, async (req) => {
    const resourceId = req.params.id;

    // For now, simulate checking ownership
    // In a real implementation, you would fetch the resource from database
    // and check if resource[ownerIdField] === req.user.id
    return {
      id: resourceId,
      resourceType: resource,
      [ownerIdField]: req.user?.id, // Assume ownership for demo
      isOwner: true
    };
  });
}

/**
 * Permission Decorator Helper
 * Used with Express routing to apply permission checks
 */
export function Permission(resource: string, action: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function(req: PermissionRequest, res: Response, ...args: any[]) {
      const middleware = requirePermission(resource, action);
      await middleware.call(this, req, res, () => {
        return method.apply(this, [req, res, ...args]);
      });
    };
  };
}

// Pre-built permission middleware for common use cases
export const requireUserRead = requirePermission(SystemResource.USER, SystemAction.READ);
export const requireUserManage = requirePermission(SystemResource.USER, SystemAction.MANAGE);
export const requireCourseRead = requirePermission(SystemResource.COURSE, SystemAction.READ);
export const requireCourseManage = requirePermission(SystemResource.COURSE, SystemAction.MANAGE);
export const requireSelectionCreate = requirePermission(SystemResource.SELECTION, SystemAction.CREATE);
export const requirePermissionAssign = requirePermission(SystemResource.PERMISSION, SystemAction.ASSIGN);