import { DataSource } from 'typeorm';
import { Permission } from '../../models/Permission';
import { RolePermission } from '../../models/RolePermission';
import { UserRole, SystemResource, SystemAction } from '../../types/permission';

export class PermissionSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    const permissionRepository = this.dataSource.getRepository(Permission);
    const rolePermissionRepository = this.dataSource.getRepository(RolePermission);

    // Clear existing permissions
    await rolePermissionRepository.delete({});
    await permissionRepository.delete({});

    // Define all system permissions
    const permissions = [
      // User permissions
      { name: 'user.create', description: '创建用户', resource: SystemResource.USER, action: SystemAction.CREATE },
      { name: 'user.read', description: '查看用户信息', resource: SystemResource.USER, action: SystemAction.READ },
      { name: 'user.read.own', description: '查看自己的用户信息', resource: SystemResource.USER, action: SystemAction.READ, conditions: [{ field: 'id', operator: 'eq', value: 'currentUser.id' }] },
      { name: 'user.update', description: '更新用户信息', resource: SystemResource.USER, action: SystemAction.UPDATE },
      { name: 'user.update.own', description: '更新自己的用户信息', resource: SystemResource.USER, action: SystemAction.UPDATE, conditions: [{ field: 'id', operator: 'eq', value: 'currentUser.id' }] },
      { name: 'user.delete', description: '删除用户', resource: SystemResource.USER, action: SystemAction.DELETE },
      { name: 'user.list', description: '列出用户', resource: SystemResource.USER, action: SystemAction.LIST },
      { name: 'user.manage', description: '管理用户账户', resource: SystemResource.USER, action: SystemAction.MANAGE },

      // Course permissions
      { name: 'course.create', description: '创建课程', resource: SystemResource.COURSE, action: SystemAction.CREATE },
      { name: 'course.read', description: '查看课程信息', resource: SystemResource.COURSE, action: SystemAction.READ },
      { name: 'course.update', description: '更新课程信息', resource: SystemResource.COURSE, action: SystemAction.UPDATE },
      { name: 'course.delete', description: '删除课程', resource: SystemResource.COURSE, action: SystemAction.DELETE },
      { name: 'course.list', description: '列出课程', resource: SystemResource.COURSE, action: SystemAction.LIST },
      { name: 'course.manage', description: '管理课程', resource: SystemResource.COURSE, action: SystemAction.MANAGE },

      // Selection permissions
      { name: 'selection.create', description: '创建选课记录', resource: SystemResource.SELECTION, action: SystemAction.CREATE },
      { name: 'selection.read', description: '查看选课记录', resource: SystemResource.SELECTION, action: SystemAction.READ },
      { name: 'selection.read.own', description: '查看自己的选课记录', resource: SystemResource.SELECTION, action: SystemAction.READ, conditions: [{ field: 'userId', operator: 'eq', value: 'currentUser.id' }] },
      { name: 'selection.update', description: '更新选课记录', resource: SystemResource.SELECTION, action: SystemAction.UPDATE },
      { name: 'selection.update.own', description: '更新自己的选课记录', resource: SystemResource.SELECTION, action: SystemAction.UPDATE, conditions: [{ field: 'userId', operator: 'eq', value: 'currentUser.id' }] },
      { name: 'selection.delete', description: '删除选课记录', resource: SystemResource.SELECTION, action: SystemAction.DELETE },
      { name: 'selection.delete.own', description: '删除自己的选课记录', resource: SystemResource.SELECTION, action: SystemAction.DELETE, conditions: [{ field: 'userId', operator: 'eq', value: 'currentUser.id' }] },
      { name: 'selection.list', description: '列出选课记录', resource: SystemResource.SELECTION, action: SystemAction.LIST },
      { name: 'selection.manage', description: '管理选课记录', resource: SystemResource.SELECTION, action: SystemAction.MANAGE },

      // Permission management
      { name: 'permission.read', description: '查看权限信息', resource: SystemResource.PERMISSION, action: SystemAction.READ },
      { name: 'permission.list', description: '列出权限', resource: SystemResource.PERMISSION, action: SystemAction.LIST },
      { name: 'permission.assign', description: '分配权限', resource: SystemResource.PERMISSION, action: SystemAction.ASSIGN },
      { name: 'permission.revoke', description: '撤销权限', resource: SystemResource.PERMISSION, action: SystemAction.REVOKE },

      // Role management
      { name: 'role.read', description: '查看角色信息', resource: SystemResource.ROLE, action: SystemAction.READ },
      { name: 'role.list', description: '列出角色', resource: SystemResource.ROLE, action: SystemAction.LIST },
      { name: 'role.manage', description: '管理角色', resource: SystemResource.ROLE, action: SystemAction.MANAGE },

      // System permissions
      { name: 'system.read', description: '查看系统信息', resource: SystemResource.SYSTEM, action: SystemAction.READ },
      { name: 'system.manage', description: '管理系统', resource: SystemResource.SYSTEM, action: SystemAction.MANAGE },
    ];

    // Create permissions
    const createdPermissions: Permission[] = [];
    for (const permissionData of permissions) {
      const permission = permissionRepository.create(permissionData);
      const saved = await permissionRepository.save(permission);
      createdPermissions.push(saved);
    }

    // Assign permissions to roles
    const roleAssignments = {
      [UserRole.STUDENT]: [
        'course.read', 'course.list',
        'selection.create', 'selection.read.own', 'selection.update.own', 'selection.delete.own',
        'user.read.own', 'user.update.own'
      ],
      [UserRole.ADMIN]: [
        'user.create', 'user.read', 'user.update', 'user.delete', 'user.list', 'user.manage',
        'course.create', 'course.read', 'course.update', 'course.delete', 'course.list', 'course.manage',
        'selection.read', 'selection.list', 'selection.manage',
        'permission.read', 'permission.list', 'permission.assign', 'permission.revoke',
        'role.read', 'role.list', 'role.manage',
        'system.read', 'system.manage'
      ]
    };

    // Create role permissions
    for (const [role, permissionNames] of Object.entries(roleAssignments)) {
      for (const permissionName of permissionNames) {
        const permission = createdPermissions.find(p => p.name === permissionName);
        if (permission) {
          const rolePermission = rolePermissionRepository.create({
            role,
            permissionId: permission.id,
            grantedAt: new Date()
          });
          await rolePermissionRepository.save(rolePermission);
        }
      }
    }

    console.log('Permissions seeded successfully');
  }
}