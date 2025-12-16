import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../models/User';
import { Permission } from '../models/Permission';
import { RolePermission } from '../models/RolePermission';
import { ResourcePermission } from '../types/permission';

export interface RolePermissionSummary {
  role: UserRole;
  permissions: Array<{
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    grantedAt: Date;
    grantedBy?: string;
  }>;
  totalPermissions: number;
}

export interface PermissionAssignmentRequest {
  role: UserRole;
  permissionIds: string[];
  grantedBy: string;
}

export interface BulkPermissionUpdate {
  assignments: PermissionAssignmentRequest[];
}

export class RolePermissionService {
  private rolePermissionRepository: Repository<RolePermission>;
  private permissionRepository: Repository<Permission>;

  constructor() {
    // Note: In a real application, you would inject the DataSource
    const dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Permission, RolePermission],
      synchronize: true
    });

    this.rolePermissionRepository = dataSource.getRepository(RolePermission);
    this.permissionRepository = dataSource.getRepository(Permission);
  }

  /**
   * Get all permissions for a specific role with detailed information
   */
  async getRolePermissions(role: UserRole): Promise<RolePermissionSummary> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      relations: ['permission', 'granter']
    });

    const permissions = rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description || '',
      resource: rp.permission.resource,
      action: rp.permission.action,
      grantedAt: rp.grantedAt,
      grantedBy: rp.grantedBy
    }));

    return {
      role,
      permissions,
      totalPermissions: permissions.length
    };
  }

  /**
   * Get all roles and their permissions summary
   */
  async getAllRolePermissions(): Promise<RolePermissionSummary[]> {
    const roles = Object.values(UserRole);
    const roleSummaries = await Promise.all(
      roles.map(role => this.getRolePermissions(role))
    );

    return roleSummaries;
  }

  /**
   * Get available permissions not assigned to a role
   */
  async getAvailablePermissionsForRole(role: UserRole): Promise<Permission[]> {
    const assignedPermissionIds = await this.getAssignedPermissionIds(role);

    const query = this.permissionRepository.createQueryBuilder('permission');

    if (assignedPermissionIds.length > 0) {
      query.where('permission.id NOT IN (:...assignedIds)', { assignedIds: assignedPermissionIds });
    }

    return query.orderBy('permission.resource, permission.action').getMany();
  }

  /**
   * Assign multiple permissions to a role
   */
  async assignPermissionsToRole(request: PermissionAssignmentRequest): Promise<RolePermission[]> {
    const { role, permissionIds, grantedBy } = request;

    // Check for existing assignments to avoid duplicates
    const existingAssignments = await this.rolePermissionRepository.find({
      where: { role }
    });

    const existingPermissionIds = existingAssignments.map(ea => ea.permissionId);
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    if (newPermissionIds.length === 0) {
      return []; // No new permissions to assign
    }

    // Create new role permission assignments
    const rolePermissions = newPermissionIds.map(permissionId =>
      this.rolePermissionRepository.create({
        role,
        permissionId,
        grantedAt: new Date(),
        grantedBy
      })
    );

    return this.rolePermissionRepository.save(rolePermissions);
  }

  /**
   * Bulk assign permissions to multiple roles
   */
  async bulkAssignPermissions(bulkUpdate: BulkPermissionUpdate): Promise<RolePermission[]> {
    const allAssignments = await Promise.all(
      bulkUpdate.assignments.map(request => this.assignPermissionsToRole(request))
    );

    return allAssignments.flat();
  }

  /**
   * Revoke a specific permission from a role
   */
  async revokePermissionFromRole(role: UserRole, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({
      role,
      permissionId
    });
  }

  /**
   * Revoke multiple permissions from a role
   */
  async revokePermissionsFromRole(role: UserRole, permissionIds: string[]): Promise<void> {
    await this.rolePermissionRepository.delete({
      role,
      permissionId: { $in: permissionIds } as any // TypeORM syntax for IN clause
    });
  }

  /**
   * Replace all permissions for a role (remove existing, add new)
   */
  async replaceRolePermissions(
    role: UserRole,
    permissionIds: string[],
    grantedBy: string
  ): Promise<RolePermission[]> {
    // Remove all existing permissions for the role
    await this.rolePermissionRepository.delete({ role });

    // Assign new permissions if any provided
    if (permissionIds.length > 0) {
      return this.assignPermissionsToRole({
        role,
        permissionIds,
        grantedBy
      });
    }

    return [];
  }

  /**
   * Copy permissions from one role to another
   */
  async copyRolePermissions(fromRole: UserRole, toRole: UserRole, grantedBy: string): Promise<RolePermission[]> {
    const sourceRolePermissions = await this.rolePermissionRepository.find({
      where: { role: fromRole }
    });

    if (sourceRolePermissions.length === 0) {
      return [];
    }

    // Remove existing permissions for target role
    await this.rolePermissionRepository.delete({ role: toRole });

    // Create new assignments for target role
    const newPermissions = sourceRolePermissions.map(srp =>
      this.rolePermissionRepository.create({
        role: toRole,
        permissionId: srp.permissionId,
        grantedAt: new Date(),
        grantedBy
      })
    );

    return this.rolePermissionRepository.save(newPermissions);
  }

  /**
   * Get permission usage statistics
   */
  async getPermissionUsageStats(): Promise<Array<{
    permissionId: string;
    permissionName: string;
    resource: string;
    action: string;
    rolesAssigned: UserRole[];
    roleCount: number;
  }>> {
    const permissions = await this.permissionRepository.find();

    const stats = await Promise.all(
      permissions.map(async permission => {
        const rolePermissions = await this.rolePermissionRepository.find({
          where: { permissionId: permission.id }
        });

        const rolesAssigned = rolePermissions.map(rp => rp.role as UserRole);

        return {
          permissionId: permission.id,
          permissionName: permission.name,
          resource: permission.resource,
          action: permission.action,
          rolesAssigned,
          roleCount: rolesAssigned.length
        };
      })
    );

    return stats.sort((a, b) => b.roleCount - a.roleCount);
  }

  /**
   * Check if a role has a specific permission
   */
  async roleHasPermission(role: UserRole, resource: string, action: string): Promise<boolean> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role,
        permission: {
          resource,
          action
        }
      },
      relations: ['permission']
    });

    return !!rolePermission;
  }

  /**
   * Get role permissions grouped by resource
   */
  async getRolePermissionsGrouped(role: UserRole): Promise<ResourcePermission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      relations: ['permission']
    });

    const grouped: Record<string, ResourcePermission> = {};

    rolePermissions.forEach(rp => {
      const resource = rp.permission.resource;

      if (!grouped[resource]) {
        grouped[resource] = {
          resource,
          actions: []
        };
      }

      grouped[resource].actions.push(rp.permission.action);
    });

    return Object.values(grouped);
  }

  /**
   * Get assigned permission IDs for a role
   */
  private async getAssignedPermissionIds(role: UserRole): Promise<string[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      select: ['permissionId']
    });

    return rolePermissions.map(rp => rp.permissionId);
  }
}