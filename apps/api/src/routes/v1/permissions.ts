import { Router } from 'express';
import { PermissionController } from '../../controllers/permissionController';
import { authenticate, requireAdmin } from '../../middleware/auth';
import {
  requirePermission,
  requirePermissionAssign,
  requirePermissionRead,
  requireRoleManage
} from '../../middleware/permission';
import { SystemResource } from '../../types/permission';

const router = Router();
const permissionController = new PermissionController();

// All permission routes require authentication
router.use(authenticate);

// Get all permissions - requires permission read access
router.get('/', requirePermissionRead, permissionController.getAllPermissions.bind(permissionController));

// Get permission usage statistics - requires permission read access
router.get('/stats', requirePermissionRead, permissionController.getPermissionUsageStats.bind(permissionController));

// Check current user permissions
router.post('/check', permissionController.checkUserPermission.bind(permissionController));

// Get all roles and their permissions - requires role management or admin
router.get('/roles',
  requireRoleManage, // Only requireRoleManage, don't use OR operator incorrectly
  permissionController.getAllRolePermissions.bind(permissionController)
);

// Get permissions for a specific role
router.get('/roles/:role/permissions',
  requirePermission(SystemResource.ROLE, SystemAction.READ),
  permissionController.getRolePermissions.bind(permissionController)
);

// Get available permissions for a role
router.get('/roles/:role/permissions/available',
  requirePermissionAssign,
  permissionController.getAvailablePermissionsForRole.bind(permissionController)
);

// Assign permissions to a role
router.post('/roles/:role/permissions',
  requirePermissionAssign,
  permissionController.assignPermissionsToRole.bind(permissionController)
);

// Replace all permissions for a role
router.put('/roles/:role/permissions',
  requirePermissionAssign,
  permissionController.replaceRolePermissions.bind(permissionController)
);

// Revoke permission from a role
router.delete('/roles/:role/permissions/:permissionId',
  requirePermissionAssign,
  permissionController.revokePermissionFromRole.bind(permissionController)
);

// Copy permissions from one role to another
router.post('/roles/:fromRole/permissions/copy/:toRole',
  requirePermissionAssign,
  permissionController.copyRolePermissions.bind(permissionController)
);

// Bulk assign permissions
router.post('/roles/permissions/bulk',
  requirePermissionAssign,
  permissionController.bulkAssignPermissions.bind(permissionController)
);

export default router;