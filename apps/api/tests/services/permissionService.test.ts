import { PermissionService } from '../../../src/services/permissionService';
import { User, UserRole } from '../../../src/models/User';
import { PermissionCheck, PermissionCondition } from '../../../src/types/permission';

// Mock TypeORM repositories
jest.mock('typeorm', () => ({
  DataSource: jest.fn().mockImplementation(() => ({
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    }),
  })),
  Repository: jest.fn(),
}));

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockUser: User;
  let mockFind: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    permissionService = new PermissionService();

    mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    // Mock repository methods
    const dataSource = require('typeorm');
    const mockRepository = dataSource().getRepository();
    mockFind = mockRepository.find;
    mockDelete = mockRepository.delete;
  });

  describe('checkPermission', () => {
    it('should return true for valid permission', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read', 'list'],
        },
        {
          resource: 'course',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
      });

      expect(result).toBe(true);
    });

    it('should return false for invalid permission', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'delete',
      });

      expect(result).toBe(false);
    });

    it('should handle wildcard permissions', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['*'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'any-action',
      });

      expect(result).toBe(true);
    });

    it('should validate conditions when present', async () => {
      const conditions: PermissionCondition[] = [
        { field: 'id', operator: 'eq', value: 'currentUser.id' },
      ];

      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
          conditions,
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
        context: {
          user: mockUser,
          resource: { id: 'user-123' },
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when conditions are not met', async () => {
      const conditions: PermissionCondition[] = [
        { field: 'id', operator: 'eq', value: 'currentUser.id' },
      ];

      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
          conditions,
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
        context: {
          user: mockUser,
          resource: { id: 'different-user-id' },
        },
      });

      expect(result).toBe(false);
    });

    it('should use cache for repeated requests', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      // First call
      await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
      });

      // Second call should use cache
      const spyGetUserPermissions = jest.spyOn(permissionService as any, 'getUserRolePermissions');
      await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
      });

      expect(spyGetUserPermissions).not.toHaveBeenCalled();
    });
  });

  describe('checkAnyPermission', () => {
    it('should return true if any permission matches', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const checks: PermissionCheck[] = [
        { resource: 'user', action: 'delete' },
        { resource: 'user', action: 'read' },
      ];

      const result = await permissionService.checkAnyPermission(mockUser, checks);

      expect(result).toBe(true);
    });

    it('should return false if no permissions match', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const checks: PermissionCheck[] = [
        { resource: 'user', action: 'delete' },
        { resource: 'user', action: 'manage' },
      ];

      const result = await permissionService.checkAnyPermission(mockUser, checks);

      expect(result).toBe(false);
    });
  });

  describe('checkAllPermissions', () => {
    it('should return true if all permissions match', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read', 'update'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const checks: PermissionCheck[] = [
        { resource: 'user', action: 'read' },
        { resource: 'user', action: 'update' },
      ];

      const result = await permissionService.checkAllPermissions(mockUser, checks);

      expect(result).toBe(true);
    });

    it('should return false if some permissions do not match', async () => {
      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const checks: PermissionCheck[] = [
        { resource: 'user', action: 'read' },
        { resource: 'user', action: 'delete' },
      ];

      const result = await permissionService.checkAllPermissions(mockUser, checks);

      expect(result).toBe(false);
    });
  });

  describe('Condition Evaluation', () => {
    const testCases = [
      { operator: 'eq', contextValue: 'test', expectedValue: 'test', expected: true },
      { operator: 'eq', contextValue: 'test', expectedValue: 'different', expected: false },
      { operator: 'ne', contextValue: 'test', expectedValue: 'test', expected: false },
      { operator: 'ne', contextValue: 'test', expectedValue: 'different', expected: true },
      { operator: 'in', contextValue: 'a', expectedValue: ['a', 'b', 'c'], expected: true },
      { operator: 'in', contextValue: 'd', expectedValue: ['a', 'b', 'c'], expected: false },
      { operator: 'nin', contextValue: 'a', expectedValue: ['a', 'b', 'c'], expected: false },
      { operator: 'nin', contextValue: 'd', expectedValue: ['a', 'b', 'c'], expected: true },
      { operator: 'gt', contextValue: 10, expectedValue: 5, expected: true },
      { operator: 'gt', contextValue: 5, expectedValue: 10, expected: false },
      { operator: 'gte', contextValue: 10, expectedValue: 10, expected: true },
      { operator: 'gte', contextValue: 9, expectedValue: 10, expected: false },
      { operator: 'lt', contextValue: 5, expectedValue: 10, expected: true },
      { operator: 'lt', contextValue: 10, expectedValue: 5, expected: false },
      { operator: 'lte', contextValue: 10, expectedValue: 10, expected: true },
      { operator: 'lte', contextValue: 11, expectedValue: 10, expected: false },
    ];

    testCases.forEach(({ operator, contextValue, expectedValue, expected }) => {
      it(`should evaluate ${operator} operator correctly`, async () => {
        const conditions: PermissionCondition[] = [
          { field: 'test', operator: operator as any, value: expectedValue },
        ];

        const mockPermissions = [
          {
            resource: 'test',
            actions: ['read'],
            conditions,
          },
        ];

        mockFind.mockResolvedValue([]);
        jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

        const result = await permissionService.checkPermission(mockUser, {
          resource: 'test',
          action: 'read',
          context: {
            user: mockUser,
            test: contextValue,
          },
        });

        expect(result).toBe(expected);
      });
    });
  });

  describe('Context Value Resolution', () => {
    it('should resolve simple field names', async () => {
      const conditions: PermissionCondition[] = [
        { field: 'user.id', operator: 'eq', value: 'user-123' },
      ];

      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
          conditions,
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
        context: {
          user: mockUser,
        },
      });

      expect(result).toBe(true);
    });

    it('should resolve nested field names', async () => {
      const conditions: PermissionCondition[] = [
        { field: 'user.profile.department', operator: 'eq', value: 'engineering' },
      ];

      const mockPermissions = [
        {
          resource: 'user',
          actions: ['read'],
          conditions,
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'user',
        action: 'read',
        context: {
          user: {
            ...mockUser,
            profile: { department: 'engineering' },
          },
        },
      });

      expect(result).toBe(true);
    });

    it('should handle currentUser.id template values', async () => {
      const conditions: PermissionCondition[] = [
        { field: 'resource.ownerId', operator: 'eq', value: 'currentUser.id' },
      ];

      const mockPermissions = [
        {
          resource: 'document',
          actions: ['read'],
          conditions,
        },
      ];

      mockFind.mockResolvedValue([]);
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue(mockPermissions);

      const result = await permissionService.checkPermission(mockUser, {
        resource: 'document',
        action: 'read',
        context: {
          user: mockUser,
          resource: { ownerId: 'user-123' },
        },
      });

      expect(result).toBe(true);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      permissionService.clearAllCache();
    });

    it('should clear cache for specific role', async () => {
      // Add something to cache
      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue([]);
      await permissionService.checkPermission(mockUser, { resource: 'test', action: 'read' });

      // Clear cache and verify it's cleared
      permissionService.clearAllCache();

      // This should trigger a new permission check
      const spy = jest.spyOn(permissionService as any, 'getUserRolePermissions');
      await permissionService.checkPermission(mockUser, { resource: 'test', action: 'read' });

      expect(spy).toHaveBeenCalled();
    });

    it('should respect cache timeout', async () => {
      // Mock cache timeout to 0 for testing
      (permissionService as any).cacheTimeout = 0;

      jest.spyOn(permissionService as any, 'getUserRolePermissions').mockResolvedValue([]);

      // First call
      await permissionService.checkPermission(mockUser, { resource: 'test', action: 'read' });

      // Second call should trigger new check due to timeout
      const spy = jest.spyOn(permissionService as any, 'getUserRolePermissions');
      await permissionService.checkPermission(mockUser, { resource: 'test', action: 'read' });

      expect(spy).toHaveBeenCalled();
    });
  });
});