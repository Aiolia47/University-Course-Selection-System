import { User, UserRole } from '../models/User';

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  context?: Record<string, any>;
}

export interface ResourcePermission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: ResourcePermission[];
}

export interface PermissionContext {
  user: User;
  resource?: any;
  request?: any;
}

export enum SystemResource {
  USER = 'user',
  COURSE = 'course',
  SELECTION = 'selection',
  PERMISSION = 'permission',
  ROLE = 'role',
  SYSTEM = 'system'
}

export enum SystemAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  MANAGE = 'manage',
  ASSIGN = 'assign',
  REVOKE = 'revoke'
}

export const DEFAULT_PERMISSIONS = {
  [UserRole.STUDENT]: [
    {
      resource: SystemResource.COURSE,
      actions: [SystemAction.READ, SystemAction.LIST]
    },
    {
      resource: SystemResource.SELECTION,
      actions: [SystemAction.CREATE, SystemAction.READ, SystemAction.UPDATE, SystemAction.DELETE]
    },
    {
      resource: SystemResource.USER,
      actions: [SystemAction.READ],
      conditions: [
        { field: 'id', operator: 'eq', value: 'currentUser.id' }
      ]
    }
  ],
  [UserRole.ADMIN]: [
    {
      resource: SystemResource.USER,
      actions: [SystemAction.CREATE, SystemAction.READ, SystemAction.UPDATE, SystemAction.DELETE, SystemAction.LIST, SystemAction.MANAGE]
    },
    {
      resource: SystemResource.COURSE,
      actions: [SystemAction.CREATE, SystemAction.READ, SystemAction.UPDATE, SystemAction.DELETE, SystemAction.LIST, SystemAction.MANAGE]
    },
    {
      resource: SystemResource.SELECTION,
      actions: [SystemAction.READ, SystemAction.LIST, SystemAction.MANAGE]
    },
    {
      resource: SystemResource.PERMISSION,
      actions: [SystemAction.READ, SystemAction.LIST, SystemAction.ASSIGN, SystemAction.REVOKE]
    },
    {
      resource: SystemResource.ROLE,
      actions: [SystemAction.READ, SystemAction.LIST, SystemAction.MANAGE]
    },
    {
      resource: SystemResource.SYSTEM,
      actions: [SystemAction.READ, SystemAction.MANAGE]
    }
  ]
} as const;