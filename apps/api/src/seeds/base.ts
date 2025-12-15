import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../models/User';
import { Course, CourseStatus } from '../models/Course';
import { Permission } from '../models/Permission';
import { RolePermission } from '../models/RolePermission';

export class BaseSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Running base seed...');

    // Create permissions
    await this.createPermissions();

    // Create role permissions
    await this.createRolePermissions();

    // Create admin user
    await this.createAdminUser();

    // Create test students
    await this.createTestStudents();

    // Create sample courses
    await this.createSampleCourses();

    console.log('Base seed completed successfully');
  }

  private async createPermissions(): Promise<void> {
    const permissionRepository = this.dataSource.getRepository(Permission);

    const permissions = [
      {
        name: 'user.create',
        description: '创建用户',
        resource: 'user',
        action: 'create',
      },
      {
        name: 'user.read',
        description: '查看用户',
        resource: 'user',
        action: 'read',
      },
      {
        name: 'user.update',
        description: '更新用户',
        resource: 'user',
        action: 'update',
      },
      {
        name: 'user.delete',
        description: '删除用户',
        resource: 'user',
        action: 'delete',
      },
      {
        name: 'course.create',
        description: '创建课程',
        resource: 'course',
        action: 'create',
      },
      {
        name: 'course.read',
        description: '查看课程',
        resource: 'course',
        action: 'read',
      },
      {
        name: 'course.update',
        description: '更新课程',
        resource: 'course',
        action: 'update',
      },
      {
        name: 'course.delete',
        description: '删除课程',
        resource: 'course',
        action: 'delete',
      },
      {
        name: 'selection.create',
        description: '创建选课记录',
        resource: 'selection',
        action: 'create',
      },
      {
        name: 'selection.read',
        description: '查看选课记录',
        resource: 'selection',
        action: 'read',
      },
      {
        name: 'selection.update',
        description: '更新选课记录',
        resource: 'selection',
        action: 'update',
      },
      {
        name: 'selection.delete',
        description: '删除选课记录',
        resource: 'selection',
        action: 'delete',
      },
      {
        name: 'selection.confirm',
        description: '确认选课',
        resource: 'selection',
        action: 'confirm',
      },
      {
        name: 'selection.cancel',
        description: '取消选课',
        resource: 'selection',
        action: 'cancel',
      },
    ];

    for (const permission of permissions) {
      const existingPermission = await permissionRepository.findOne({
        where: { name: permission.name },
      });

      if (!existingPermission) {
        await permissionRepository.save(permissionRepository.create(permission));
        console.log(`Created permission: ${permission.name}`);
      }
    }
  }

  private async createRolePermissions(): Promise<void> {
    const rolePermissionRepository = this.dataSource.getRepository(RolePermission);
    const permissionRepository = this.dataSource.getRepository(Permission);

    // Get all permissions
    const permissions = await permissionRepository.find();

    // Assign all permissions to admin role
    for (const permission of permissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: {
          role: UserRole.ADMIN,
          permissionId: permission.id,
        },
      });

      if (!existingRolePermission) {
        await rolePermissionRepository.save(
          rolePermissionRepository.create({
            role: UserRole.ADMIN,
            permissionId: permission.id,
            grantedAt: new Date(),
          })
        );
        console.log(`Assigned permission ${permission.name} to admin role`);
      }
    }

    // Assign specific permissions to student role
    const studentPermissions = [
      'course.read',
      'selection.create',
      'selection.read',
      'selection.update',
      'selection.cancel',
    ];

    for (const permissionName of studentPermissions) {
      const permission = await permissionRepository.findOne({
        where: { name: permissionName },
      });

      if (permission) {
        const existingRolePermission = await rolePermissionRepository.findOne({
          where: {
            role: UserRole.STUDENT,
            permissionId: permission.id,
          },
        });

        if (!existingRolePermission) {
          await rolePermissionRepository.save(
            rolePermissionRepository.create({
              role: UserRole.STUDENT,
              permissionId: permission.id,
              grantedAt: new Date(),
            })
          );
          console.log(`Assigned permission ${permissionName} to student role`);
        }
      }
    }
  }

  private async createAdminUser(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await userRepository.save(
        userRepository.create({
          username: 'admin',
          email: 'admin@bmad7.com',
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        })
      );
      console.log('Created admin user: admin / admin123');
    }
  }

  private async createTestStudents(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    const students = [
      {
        username: 'student001',
        email: 'student001@bmad7.com',
        studentId: '2021001',
        password: 'student123',
      },
      {
        username: 'student002',
        email: 'student002@bmad7.com',
        studentId: '2021002',
        password: 'student123',
      },
      {
        username: 'student003',
        email: 'student003@bmad7.com',
        studentId: '2021003',
        password: 'student123',
      },
      {
        username: 'student004',
        email: 'student004@bmad7.com',
        studentId: '2021004',
        password: 'student123',
      },
      {
        username: 'student005',
        email: 'student005@bmad7.com',
        studentId: '2021005',
        password: 'student123',
      },
    ];

    for (const studentData of students) {
      const existingStudent = await userRepository.findOne({
        where: { username: studentData.username },
      });

      if (!existingStudent) {
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        await userRepository.save(
          userRepository.create({
            username: studentData.username,
            email: studentData.email,
            studentId: studentData.studentId,
            passwordHash: hashedPassword,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
          })
        );
        console.log(`Created student user: ${studentData.username}`);
      }
    }
  }

  private async createSampleCourses(): Promise<void> {
    const courseRepository = this.dataSource.getRepository(Course);

    const courses = [
      {
        code: 'CS101',
        name: '计算机科学导论',
        description: '计算机科学的基础概念、原理和应用',
        credits: 3,
        teacher: '张教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS201',
        name: '数据结构与算法',
        description: '基本数据结构和算法设计与分析',
        credits: 4,
        teacher: '李教授',
        capacity: 25,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS301',
        name: '数据库系统',
        description: '数据库设计、实现和管理',
        credits: 3,
        teacher: '王教授',
        capacity: 20,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS302',
        name: '软件工程',
        description: '软件开发过程、方法和工具',
        credits: 3,
        teacher: '赵教授',
        capacity: 30,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS401',
        name: '人工智能',
        description: '人工智能的基本概念、算法和应用',
        credits: 4,
        teacher: '刘教授',
        capacity: 15,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS402',
        name: '机器学习',
        description: '机器学习算法和实践',
        credits: 4,
        teacher: '陈教授',
        capacity: 20,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS501',
        name: '计算机网络',
        description: '计算机网络协议和体系结构',
        credits: 3,
        teacher: '孙教授',
        capacity: 25,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'CS502',
        name: '操作系统',
        description: '操作系统原理和设计',
        credits: 3,
        teacher: '周教授',
        capacity: 20,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'MATH101',
        name: '高等数学',
        description: '微积分和数学分析基础',
        credits: 4,
        teacher: '吴教授',
        capacity: 50,
        status: CourseStatus.PUBLISHED,
      },
      {
        code: 'MATH201',
        name: '线性代数',
        description: '线性代数基础和应用',
        credits: 3,
        teacher: '郑教授',
        capacity: 40,
        status: CourseStatus.PUBLISHED,
      },
    ];

    for (const courseData of courses) {
      const existingCourse = await courseRepository.findOne({
        where: { code: courseData.code },
      });

      if (!existingCourse) {
        await courseRepository.save(courseRepository.create(courseData));
        console.log(`Created course: ${courseData.code} - ${courseData.name}`);
      }
    }
  }
}