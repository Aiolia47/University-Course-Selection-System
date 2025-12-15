import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateInitialTables1640000000001 implements MigrationInterface {
  name = 'CreateInitialTables1640000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['student', 'admin'],
            default: "'student'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended'],
            default: "'active'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create courses table
    await queryRunner.createTable(
      new Table({
        name: 'courses',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'credits',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'teacher',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'capacity',
            type: 'int',
            unsigned: true,
            default: 1,
          },
          {
            name: 'enrolled',
            type: 'int',
            unsigned: true,
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'published', 'cancelled', 'completed'],
            default: "'draft'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create selections table
    await queryRunner.createTable(
      new Table({
        name: 'selections',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'course_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: "'pending'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'selected_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'confirmed_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'conditions',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create role_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'permission_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'granted_at',
            type: 'datetime',
          },
          {
            name: 'granted_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'create',
              'update',
              'delete',
              'login',
              'logout',
              'select_course',
              'cancel_selection',
              'confirm_selection'
            ],
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'resource_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_username', ['username'])
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_email', ['email'])
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_student_id', ['student_id'])
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_role', ['role'])
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_users_status', ['status'])
    );

    await queryRunner.createIndex(
      'courses',
      new Index('IDX_courses_code', ['code'])
    );

    await queryRunner.createIndex(
      'courses',
      new Index('IDX_courses_teacher', ['teacher'])
    );

    await queryRunner.createIndex(
      'courses',
      new Index('IDX_courses_status', ['status'])
    );

    await queryRunner.createIndex(
      'courses',
      new Index('IDX_courses_credits', ['credits'])
    );

    await queryRunner.createIndex(
      'selections',
      new Index('IDX_selections_user_id', ['user_id'])
    );

    await queryRunner.createIndex(
      'selections',
      new Index('IDX_selections_course_id', ['course_id'])
    );

    await queryRunner.createIndex(
      'selections',
      new Index('IDX_selections_status', ['status'])
    );

    await queryRunner.createIndex(
      'permissions',
      new Index('IDX_permissions_name', ['name'])
    );

    await queryRunner.createIndex(
      'permissions',
      new Index('IDX_permissions_resource', ['resource'])
    );

    await queryRunner.createIndex(
      'permissions',
      new Index('IDX_permissions_action', ['action'])
    );

    await queryRunner.createIndex(
      'role_permissions',
      new Index('IDX_role_permissions_role', ['role'])
    );

    await queryRunner.createIndex(
      'role_permissions',
      new Index('IDX_role_permissions_permission_id', ['permission_id'])
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_audit_logs_user_id', ['user_id'])
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_audit_logs_action', ['action'])
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_audit_logs_resource', ['resource'])
    );

    await queryRunner.createIndex(
      'audit_logs',
      new Index('IDX_audit_logs_created_at', ['created_at'])
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'selections',
      {
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }
    );

    await queryRunner.createForeignKey(
      'selections',
      {
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      {
        columnNames: ['permission_id'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      {
        columnNames: ['granted_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }
    );

    await queryRunner.createForeignKey(
      'audit_logs',
      {
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }
    );

    // Create unique constraint for selections (user_id, course_id)
    await queryRunner.query(
      `ALTER TABLE selections ADD UNIQUE KEY unique_user_course (user_id, course_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE selections DROP INDEX unique_user_course`);

    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('selections');
    await queryRunner.dropTable('courses');
    await queryRunner.dropTable('users');
  }
}