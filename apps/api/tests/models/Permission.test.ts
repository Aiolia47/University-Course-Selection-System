import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../src/models/Permission';
import { RolePermission } from '../../../src/models/RolePermission';
import { DataSource } from 'typeorm';

describe('Permission Model', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Permission, RolePermission],
      synchronize: true,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    const repository = dataSource.getRepository(Permission);
    await repository.clear();
  });

  describe('Permission Entity', () => {
    it('should create a permission with valid data', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = repository.create({
        name: 'user.create',
        description: '创建用户权限',
        resource: 'user',
        action: 'create',
      });

      const savedPermission = await repository.save(permission);

      expect(savedPermission.id).toBeDefined();
      expect(savedPermission.name).toBe('user.create');
      expect(savedPermission.description).toBe('创建用户权限');
      expect(savedPermission.resource).toBe('user');
      expect(savedPermission.action).toBe('create');
      expect(savedPermission.createdAt).toBeInstanceOf(Date);
      expect(savedPermission.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a permission with conditions', async () => {
      const repository = dataSource.getRepository(Permission);

      const conditions = {
        field: 'department',
        operator: 'eq',
        value: 'engineering'
      };

      const permission = repository.create({
        name: 'user.read.department',
        description: '查看部门用户',
        resource: 'user',
        action: 'read',
        conditions,
      });

      const savedPermission = await repository.save(permission);

      expect(savedPermission.conditions).toEqual(conditions);
    });

    it('should enforce unique name constraint', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission1 = repository.create({
        name: 'user.create',
        description: '创建用户权限',
        resource: 'user',
        action: 'create',
      });

      await repository.save(permission1);

      const permission2 = repository.create({
        name: 'user.create', // Same name
        description: '重复的创建用户权限',
        resource: 'user',
        action: 'create',
      });

      await expect(repository.save(permission2)).rejects.toThrow();
    });

    it('should update permission timestamp on save', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = repository.create({
        name: 'user.update',
        description: '更新用户权限',
        resource: 'user',
        action: 'update',
      });

      const savedPermission = await repository.save(permission);
      const originalUpdatedAt = savedPermission.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedPermission.description = '更新后的描述';
      const updatedPermission = await repository.save(savedPermission);

      expect(updatedPermission.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Permission Relationships', () => {
    it('should establish relationship with role permissions', async () => {
      const permissionRepository = dataSource.getRepository(Permission);
      const rolePermissionRepository = dataSource.getRepository(RolePermission);

      // Create permission
      const permission = permissionRepository.create({
        name: 'course.read',
        description: '读取课程',
        resource: 'course',
        action: 'read',
      });
      const savedPermission = await permissionRepository.save(permission);

      // Create role permission
      const rolePermission = rolePermissionRepository.create({
        role: 'student',
        permissionId: savedPermission.id,
        grantedAt: new Date(),
      });
      const savedRolePermission = await rolePermissionRepository.save(rolePermission);

      // Verify relationship
      const permissionWithRolePermissions = await permissionRepository.findOne({
        where: { id: savedPermission.id },
        relations: ['rolePermissions'],
      });

      expect(permissionWithRolePermissions).toBeDefined();
      expect(permissionWithRolePermissions!.rolePermissions).toHaveLength(1);
      expect(permissionWithRolePermissions!.rolePermissions[0].role).toBe('student');
    });
  });

  describe('Permission Validation', () => {
    it('should require name field', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = repository.create({
        description: '没有名称的权限',
        resource: 'user',
        action: 'read',
      });

      await expect(repository.save(permission)).rejects.toThrow();
    });

    it('should require resource field', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = repository.create({
        name: 'test.permission',
        description: '测试权限',
        action: 'read',
      });

      await expect(repository.save(permission)).rejects.toThrow();
    });

    it('should require action field', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = repository.create({
        name: 'test.permission',
        description: '测试权限',
        resource: 'user',
      });

      await expect(repository.save(permission)).rejects.toThrow();
    });

    it('should limit name length', async () => {
      const repository = dataSource.getRepository(Permission);

      const longName = 'a'.repeat(101); // Exceeds 100 character limit

      const permission = repository.create({
        name: longName,
        description: '名称过长的权限',
        resource: 'user',
        action: 'read',
      });

      await expect(repository.save(permission)).rejects.toThrow();
    });
  });

  describe('Permission Queries', () => {
    beforeEach(async () => {
      const repository = dataSource.getRepository(Permission);

      const permissions = [
        { name: 'user.create', resource: 'user', action: 'create', description: '创建用户' },
        { name: 'user.read', resource: 'user', action: 'read', description: '读取用户' },
        { name: 'user.update', resource: 'user', action: 'update', description: '更新用户' },
        { name: 'course.create', resource: 'course', action: 'create', description: '创建课程' },
        { name: 'course.read', resource: 'course', action: 'read', description: '读取课程' },
      ];

      for (const perm of permissions) {
        const permission = repository.create(perm);
        await repository.save(permission);
      }
    });

    it('should find permissions by resource', async () => {
      const repository = dataSource.getRepository(Permission);

      const userPermissions = await repository.find({
        where: { resource: 'user' },
      });

      expect(userPermissions).toHaveLength(3);
      userPermissions.forEach(p => {
        expect(p.resource).toBe('user');
      });
    });

    it('should find permissions by action', async () => {
      const repository = dataSource.getRepository(Permission);

      const readPermissions = await repository.find({
        where: { action: 'read' },
      });

      expect(readPermissions).toHaveLength(2);
      readPermissions.forEach(p => {
        expect(p.action).toBe('read');
      });
    });

    it('should find permission by name', async () => {
      const repository = dataSource.getRepository(Permission);

      const permission = await repository.findOne({
        where: { name: 'user.create' },
      });

      expect(permission).toBeDefined();
      expect(permission!.resource).toBe('user');
      expect(permission!.action).toBe('create');
    });

    it('should order permissions by name', async () => {
      const repository = dataSource.getRepository(Permission);

      const permissions = await repository.find({
        order: { name: 'ASC' },
      });

      const names = permissions.map(p => p.name);
      expect(names).toEqual(names.sort());
    });
  });
});