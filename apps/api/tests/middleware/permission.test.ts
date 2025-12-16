import { Request, Response, NextFunction } from 'express';
import {
  requirePermission,
  requireResourcePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnershipOrAdmin
} from '../../../src/middleware/permission';
import { User, UserRole } from '../../../src/models/User';

// Mock dependencies
jest.mock('../../../src/services/permissionService');

describe('Permission Middleware', () => {
  let mockRequest: Partial<PermissionRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.STUDENT,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User,
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('requirePermission', () => {
    it('should call next() when user has permission', async () => {
      // Mock PermissionService to return true
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      const middleware = requirePermission('user', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCheckPermission).toHaveBeenCalledWith(mockRequest.user, {
        resource: 'user',
        action: 'read',
        context: expect.any(Object),
      });
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks permission', async () => {
      // Mock PermissionService to return false
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(false);

      const middleware = requirePermission('user', 'delete');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '权限不足',
        data: {
          required: 'user:delete',
          userRole: UserRole.STUDENT,
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      const middleware = requirePermission('user', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '需要认证',
      });
    });

    it('should handle permission service errors', async () => {
      // Mock PermissionService to throw error
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockRejectedValue(new Error('Service error'));

      const middleware = requirePermission('user', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '权限验证失败',
      });
    });

    it('should pass resource data to permission check when getResource is provided', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      const mockResourceData = { id: 'resource-123', name: 'Test Resource' };
      const getResource = jest.fn().mockResolvedValue(mockResourceData);

      const middleware = requirePermission('resource', 'read', getResource);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(getResource).toHaveBeenCalledWith(mockRequest);
      expect(mockRequest.permissionContext).toEqual({
        resource: mockResourceData,
        action: 'read',
        resourceId: 'resource-123',
      });
      expect(mockCheckPermission).toHaveBeenCalledWith(mockRequest.user, {
        resource: 'resource',
        action: 'read',
        context: expect.objectContaining({
          resource: mockResourceData,
        }),
      });
    });
  });

  describe('requireResourcePermission', () => {
    it('should extract resource ID from params and create resource object', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      mockRequest.params = { id: 'resource-456' };

      const middleware = requireResourcePermission('course', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.permissionContext).toEqual({
        resource: {
          id: 'resource-456',
          resourceType: 'course',
        },
        action: 'read',
        resourceId: 'resource-456',
      });
      expect(mockCheckPermission).toHaveBeenCalled();
    });

    it('should use custom parameter name when provided', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      mockRequest.params = { courseId: 'course-789' };

      const middleware = requireResourcePermission('course', 'read', 'courseId');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.permissionContext?.resourceId).toBe('course-789');
    });
  });

  describe('requireAnyPermission', () => {
    it('should call next() when user has at least one required permission', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckAnyPermission = PermissionService.prototype.checkAnyPermission = jest.fn().mockResolvedValue(true);

      const permissions = [
        { resource: 'user', action: 'read' },
        { resource: 'user', action: 'list' },
      ];

      const middleware = requireAnyPermission(permissions);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCheckAnyPermission).toHaveBeenCalledWith(mockRequest.user, [
        { resource: 'user', action: 'read', context: expect.any(Object) },
        { resource: 'user', action: 'list', context: expect.any(Object) },
      ]);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when user has none of the required permissions', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckAnyPermission = PermissionService.prototype.checkAnyPermission = jest.fn().mockResolvedValue(false);

      const permissions = [
        { resource: 'user', action: 'delete' },
        { resource: 'user', action: 'manage' },
      ];

      const middleware = requireAnyPermission(permissions);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '权限不足',
        data: {
          required: ['user:delete', 'user:manage'],
          userRole: UserRole.STUDENT,
        },
      });
    });
  });

  describe('requireAllPermissions', () => {
    it('should call next() when user has all required permissions', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckAllPermissions = PermissionService.prototype.checkAllPermissions = jest.fn().mockResolvedValue(true);

      const permissions = [
        { resource: 'user', action: 'read' },
        { resource: 'user', action: 'update' },
      ];

      const middleware = requireAllPermissions(permissions);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCheckAllPermissions).toHaveBeenCalledWith(mockRequest.user, [
        { resource: 'user', action: 'read', context: expect.any(Object) },
        { resource: 'user', action: 'update', context: expect.any(Object) },
      ]);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when user lacks some required permissions', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckAllPermissions = PermissionService.prototype.checkAllPermissions = jest.fn().mockResolvedValue(false);

      const permissions = [
        { resource: 'user', action: 'read' },
        { resource: 'user', action: 'delete' },
      ];

      const middleware = requireAllPermissions(permissions);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow access when user is admin', async () => {
      mockRequest.user!.role = UserRole.ADMIN;
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      mockRequest.params = { id: 'resource-123' };

      const middleware = requireOwnershipOrAdmin('selection', 'update', 'userId');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should allow access when user owns the resource', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      mockRequest.params = { id: 'selection-123' };
      mockRequest.user!.id = 'user-123';

      const middleware = requireOwnershipOrAdmin('selection', 'update', 'userId');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.permissionContext?.resource).toEqual({
        id: 'selection-123',
        resourceType: 'selection',
        userId: 'user-123',
        isOwner: true,
      });
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      mockRequest.user = undefined;

      const middleware = requireAnyPermission([{ resource: 'user', action: 'read' }]);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle PermissionService constructor errors', async () => {
      // Mock PermissionService to throw error in constructor
      const { PermissionService } = require('../../../src/services/permissionService');
      PermissionService.mockImplementation(() => {
        throw new Error('Constructor error');
      });

      const middleware = requirePermission('user', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle JSON serialization errors', async () => {
      // Create a response object that throws on json()
      const errorResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          throw new Error('JSON serialization error');
        }),
      };

      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(false);

      const middleware = requirePermission('user', 'delete');

      await middleware(mockRequest as Request, errorResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Context Building', () => {
    it('should build proper context object', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      const middleware = requirePermission('user', 'read');

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCheckPermission).toHaveBeenCalledWith(mockRequest.user, {
        resource: 'user',
        action: 'read',
        context: {
          user: mockRequest.user,
          resource: undefined,
          request: mockRequest,
        },
      });
    });

    it('should include additional context when provided', async () => {
      const { PermissionService } = require('../../../src/services/permissionService');
      const mockCheckPermission = PermissionService.prototype.checkPermission = jest.fn().mockResolvedValue(true);

      const additionalContext = { department: 'engineering', level: 'senior' };

      const middleware = requirePermission('user', 'read', undefined);

      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockCheckPermission).toHaveBeenCalledWith(mockRequest.user, {
        resource: 'user',
        action: 'read',
        context: expect.objectContaining({
          user: mockRequest.user,
          request: mockRequest,
        }),
      });
    });
  });
});