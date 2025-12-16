import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../models/User';
import { Permission } from '../models/Permission';
import { RolePermission } from '../models/RolePermission';
import {
  PermissionCheck,
  PermissionContext,
  PermissionCondition,
  ResourcePermission,
  DEFAULT_PERMISSIONS
} from '../types/permission';

export class PermissionService {
  private permissionRepository: Repository<Permission>;
  private rolePermissionRepository: Repository<RolePermission>;
  private cache: Map<string, any[]> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();

  constructor() {
    // Note: In a real application, you would inject the DataSource
    // This is a simplified version for demonstration
    const dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Permission, RolePermission],
      synchronize: true
    });

    this.permissionRepository = dataSource.getRepository(Permission);
    this.rolePermissionRepository = dataSource.getRepository(RolePermission);
  }

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(user: User, permissionCheck: PermissionCheck): Promise<boolean> {
    const cacheKey = `${user.id}:${permissionCheck.resource}:${permissionCheck.action}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cachedResult = this.cache.get(cacheKey);
      return cachedResult ? true : false;
    }

    // Get user's role permissions
    const rolePermissions = await this.getUserRolePermissions(user.role);

    // Check if user has the required permission
    const hasPermission = rolePermissions.some(rp => {
      if (rp.resource !== permissionCheck.resource) {
        return false;
      }

      // Check if action is allowed
      if (rp.actions.includes('*') || rp.actions.includes(permissionCheck.action)) {
        // If there are conditions, validate them
        if (rp.conditions && rp.conditions.length > 0) {
          return this.validateConditions(rp.conditions, permissionCheck);
        }
        return true;
      }

      return false;
    });

    // Cache the result
    this.cache.set(cacheKey, hasPermission);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return hasPermission;
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  async checkAnyPermission(user: User, permissionChecks: PermissionCheck[]): Promise<boolean> {
    const results = await Promise.all(
      permissionChecks.map(check => this.checkPermission(user, check))
    );
    return results.some(result => result);
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  async checkAllPermissions(user: User, permissionChecks: PermissionCheck[]): Promise<boolean> {
    const results = await Promise.all(
      permissionChecks.map(check => this.checkPermission(user, check))
    );
    return results.every(result => result);
  }

  /**
   * Get all permissions for a user's role
   */
  async getUserRolePermissions(role: UserRole): Promise<ResourcePermission[]> {
    const cacheKey = `role:${role}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    // First, try to get from database
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      relations: ['permission']
    });

    if (rolePermissions.length > 0) {
      const permissions = rolePermissions.map(rp => ({
        resource: rp.permission.resource,
        actions: [rp.permission.action],
        conditions: rp.permission.conditions as PermissionCondition[] || undefined
      }));

      // Group by resource and combine actions
      const groupedPermissions = this.groupPermissionsByResource(permissions);

      // Cache the result
      this.cache.set(cacheKey, groupedPermissions);
      this.cacheTimestamps.set(cacheKey, Date.now());

      return groupedPermissions;
    }

    // Fall back to default permissions
    const defaultPermissions = DEFAULT_PERMISSIONS[role] || [];

    // Cache the result
    this.cache.set(cacheKey, defaultPermissions);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return defaultPermissions;
  }

  /**
   * Get all available system permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  /**
   * Get permissions by role
   */
  async getPermissionsByRole(role: UserRole): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      relations: ['permission']
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(
    role: UserRole,
    permissionId: string,
    grantedBy: string
  ): Promise<RolePermission> {
    const existing = await this.rolePermissionRepository.findOne({
      where: { role, permissionId }
    });

    if (existing) {
      throw new Error('Permission already assigned to role');
    }

    const rolePermission = this.rolePermissionRepository.create({
      role,
      permissionId,
      grantedAt: new Date(),
      grantedBy
    });

    const saved = await this.rolePermissionRepository.save(rolePermission);

    // Clear cache for this role
    this.clearCache(`role:${role}`);

    return saved;
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(role: UserRole, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({
      role,
      permissionId
    });

    // Clear cache for this role
    this.clearCache(`role:${role}`);
  }

  /**
   * Validate permission conditions against context
   */
  private validateConditions(conditions: PermissionCondition[], permissionCheck: PermissionCheck): boolean {
    if (!permissionCheck.context) {
      return conditions.length === 0;
    }

    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const contextValue = this.getContextValue(field, permissionCheck.context!);

      return this.evaluateCondition(contextValue, operator, value, permissionCheck.context);
    });
  }

  /**
   * Get value from context using dot notation
   */
  private getContextValue(field: string, context: PermissionContext): any {
    if (field.includes('.')) {
      const parts = field.split('.');
      let value: any = context;

      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return null;
        }
      }

      return value;
    }

    return context[field as keyof PermissionContext] || null;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    contextValue: any,
    operator: string,
    expectedValue: any,
    context: PermissionContext
  ): boolean {
    // Handle template values like 'currentUser.id'
    if (typeof expectedValue === 'string' && expectedValue.startsWith('currentUser.')) {
      const userField = expectedValue.replace('currentUser.', '');
      expectedValue = context.user[userField as keyof User];
    }

    switch (operator) {
      case 'eq':
        return contextValue === expectedValue;
      case 'ne':
        return contextValue !== expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(contextValue);
      case 'nin':
        return Array.isArray(expectedValue) && !expectedValue.includes(contextValue);
      case 'gt':
        return Number(contextValue) > Number(expectedValue);
      case 'gte':
        return Number(contextValue) >= Number(expectedValue);
      case 'lt':
        return Number(contextValue) < Number(expectedValue);
      case 'lte':
        return Number(contextValue) <= Number(expectedValue);
      case 'contains':
        return String(contextValue).includes(String(expectedValue));
      case 'startsWith':
        return String(contextValue).startsWith(String(expectedValue));
      case 'endsWith':
        return String(contextValue).endsWith(String(expectedValue));
      default:
        return false;
    }
  }

  /**
   * Group permissions by resource and combine actions
   */
  private groupPermissionsByResource(permissions: Array<{
    resource: string;
    actions: string[];
    conditions?: PermissionCondition[];
  }>): ResourcePermission[] {
    const grouped: Record<string, ResourcePermission> = {};

    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = {
          resource: permission.resource,
          actions: [],
          conditions: permission.conditions
        };
      }

      permission.actions.forEach(action => {
        if (!grouped[permission.resource].actions.includes(action)) {
          grouped[permission.resource].actions.push(action);
        }
      });
    });

    return Object.values(grouped);
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    return Date.now() - timestamp < this.cacheTimeout;
  }

  /**
   * Clear cache for a specific key
   */
  private clearCache(key: string): void {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}