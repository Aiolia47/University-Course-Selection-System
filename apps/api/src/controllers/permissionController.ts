import { Request, Response } from 'express';
import { PermissionService } from '../services/permissionService';
import { RolePermissionService } from '../services/rolePermissionService';
import { ApiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { requirePermission, requirePermissionAssign } from '../middleware/permission';

export class PermissionController {
  private permissionService: PermissionService;
  private rolePermissionService: RolePermissionService;

  constructor() {
    this.permissionService = new PermissionService();
    this.rolePermissionService = new RolePermissionService();
  }

  /**
   * Get all available permissions
   * GET /permissions
   */
  async getAllPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = await this.permissionService.getAllPermissions();

      ApiResponse.success(res, '获取权限列表成功', {
        permissions,
        total: permissions.length
      });
    } catch (error) {
      console.error('Get all permissions error:', error);
      ApiResponse.internalError(res, '获取权限列表失败', error.message);
    }
  }

  /**
   * Get permissions for a specific role
   * GET /roles/:role/permissions
   */
  async getRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      const rolePermissions = await this.rolePermissionService.getRolePermissions(role as UserRole);

      ApiResponse.success(res, '获取角色权限成功', rolePermissions);
    } catch (error) {
      console.error('Get role permissions error:', error);
      ApiResponse.internalError(res, '获取角色权限失败', error.message);
    }
  }

  /**
   * Get all roles and their permissions
   * GET /roles/permissions
   */
  async getAllRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const allRolePermissions = await this.rolePermissionService.getAllRolePermissions();

      ApiResponse.success(res, '获取所有角色权限成功', {
        roles: allRolePermissions,
        totalRoles: allRolePermissions.length
      });
    } catch (error) {
      console.error('Get all role permissions error:', error);
      ApiResponse.internalError(res, '获取所有角色权限失败', error.message);
    }
  }

  /**
   * Get available permissions not assigned to a role
   * GET /roles/:role/permissions/available
   */
  async getAvailablePermissionsForRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      const availablePermissions = await this.rolePermissionService.getAvailablePermissionsForRole(role as UserRole);

      ApiResponse.success(res, '获取可用权限成功', {
        permissions: availablePermissions,
        total: availablePermissions.length
      });
    } catch (error) {
      console.error('Get available permissions error:', error);
      ApiResponse.internalError(res, '获取可用权限失败', error.message);
    }
  }

  /**
   * Assign permissions to a role
   * POST /roles/:role/permissions
   */
  async assignPermissionsToRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const { permissionIds } = req.body;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        ApiResponse.badRequest(res, '权限ID列表不能为空');
        return;
      }

      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const rolePermissions = await this.rolePermissionService.assignPermissionsToRole({
        role: role as UserRole,
        permissionIds,
        grantedBy: req.user.id
      });

      // Clear permission cache
      this.permissionService.clearAllCache();

      ApiResponse.created(res, '权限分配成功', {
        assignedCount: rolePermissions.length,
        role,
        permissionIds
      });
    } catch (error) {
      console.error('Assign permissions error:', error);
      ApiResponse.internalError(res, '权限分配失败', error.message);
    }
  }

  /**
   * Revoke permission from a role
   * DELETE /roles/:role/permissions/:permissionId
   */
  async revokePermissionFromRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role, permissionId } = req.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      await this.rolePermissionService.revokePermissionFromRole(role as UserRole, permissionId);

      // Clear permission cache
      this.permissionService.clearAllCache();

      ApiResponse.success(res, '权限撤销成功', {
        role,
        permissionId
      });
    } catch (error) {
      console.error('Revoke permission error:', error);
      ApiResponse.internalError(res, '权限撤销失败', error.message);
    }
  }

  /**
   * Replace all permissions for a role
   * PUT /roles/:role/permissions
   */
  async replaceRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const { permissionIds } = req.body;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      if (!Array.isArray(permissionIds)) {
        ApiResponse.badRequest(res, '权限ID列表必须是数组');
        return;
      }

      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const rolePermissions = await this.rolePermissionService.replaceRolePermissions(
        role as UserRole,
        permissionIds,
        req.user.id
      );

      // Clear permission cache
      this.permissionService.clearAllCache();

      ApiResponse.success(res, '角色权限更新成功', {
        role,
        totalPermissions: rolePermissions.length,
        permissionIds
      });
    } catch (error) {
      console.error('Replace role permissions error:', error);
      ApiResponse.internalError(res, '角色权限更新失败', error.message);
    }
  }

  /**
   * Copy permissions from one role to another
   * POST /roles/:fromRole/permissions/copy/:toRole
   */
  async copyRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fromRole, toRole } = req.params;

      if (!Object.values(UserRole).includes(fromRole as UserRole) ||
          !Object.values(UserRole).includes(toRole as UserRole)) {
        ApiResponse.badRequest(res, '无效的角色');
        return;
      }

      if (fromRole === toRole) {
        ApiResponse.badRequest(res, '源角色和目标角色不能相同');
        return;
      }

      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const copiedPermissions = await this.rolePermissionService.copyRolePermissions(
        fromRole as UserRole,
        toRole as UserRole,
        req.user.id
      );

      // Clear permission cache
      this.permissionService.clearAllCache();

      ApiResponse.success(res, '角色权限复制成功', {
        fromRole,
        toRole,
        copiedCount: copiedPermissions.length
      });
    } catch (error) {
      console.error('Copy role permissions error:', error);
      ApiResponse.internalError(res, '角色权限复制失败', error.message);
    }
  }

  /**
   * Get permission usage statistics
   * GET /permissions/stats
   */
  async getPermissionUsageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await this.rolePermissionService.getPermissionUsageStats();

      ApiResponse.success(res, '获取权限使用统计成功', {
        stats,
        totalPermissions: stats.length
      });
    } catch (error) {
      console.error('Get permission stats error:', error);
      ApiResponse.internalError(res, '获取权限使用统计失败', error.message);
    }
  }

  /**
   * Check if current user has specific permission
   * POST /permissions/check
   */
  async checkUserPermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { resource, action, context } = req.body;

      if (!resource || !action) {
        ApiResponse.badRequest(res, '资源和操作参数不能为空');
        return;
      }

      if (!req.user) {
        ApiResponse.unauthorized(res, '需要认证');
        return;
      }

      const hasPermission = await this.permissionService.checkPermission(req.user, {
        resource,
        action,
        context: {
          user: req.user,
          ...context
        }
      });

      ApiResponse.success(res, '权限检查完成', {
        hasPermission,
        userRole: req.user.role,
        resource,
        action
      });
    } catch (error) {
      console.error('Check permission error:', error);
      ApiResponse.internalError(res, '权限检查失败', error.message);
    }
  }

  /**
   * Bulk assign permissions to multiple roles
   * POST /roles/permissions/bulk
   */
  async bulkAssignPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignments } = req.body;

      if (!Array.isArray(assignments) || assignments.length === 0) {
        ApiResponse.badRequest(res, '分配列表不能为空');
        return;
      }

      // Validate all assignments
      for (const assignment of assignments) {
        if (!Object.values(UserRole).includes(assignment.role)) {
          ApiResponse.badRequest(res, `无效的角色: ${assignment.role}`);
          return;
        }

        if (!Array.isArray(assignment.permissionIds) || assignment.permissionIds.length === 0) {
          ApiResponse.badRequest(res, `角色 ${assignment.role} 的权限ID列表不能为空`);
          return;
        }
      }

      // Add grantedBy to each assignment
      const bulkUpdate = {
        assignments: assignments.map(assignment => ({
          ...assignment,
          grantedBy: req.user!.id
        }))
      };

      const result = await this.rolePermissionService.bulkAssignPermissions(bulkUpdate);

      // Clear permission cache
      this.permissionService.clearAllCache();

      ApiResponse.success(res, '批量权限分配成功', {
        totalAssignments: result.length,
        rolesAffected: assignments.length
      });
    } catch (error) {
      console.error('Bulk assign permissions error:', error);
      ApiResponse.internalError(res, '批量权限分配失败', error.message);
    }
  }
}