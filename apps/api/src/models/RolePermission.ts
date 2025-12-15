import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Permission } from './Permission';
import { User } from './User';

@Entity('role_permissions')
@Index(['role'])
@Index(['permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'uuid', name: 'permission_id' })
  permissionId: string;

  @Column({ type: 'datetime', name: 'granted_at' })
  grantedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'granted_by' })
  grantedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Permission, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @ManyToOne(() => User, user => user.grantedPermissions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'granted_by' })
  granter: User | null;
}