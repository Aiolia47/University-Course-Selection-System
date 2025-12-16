import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, Index } from 'typeorm';
import { Selection } from './Selection';
import { RolePermission } from './RolePermission';
import { AuditLog } from './AuditLog';
import { UserProfile } from './UserProfile';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

@Entity('users')
@Index(['username'])
@Index(['email'])
@Index(['studentId'])
@Index(['role'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true, name: 'student_id' })
  studentId: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Selection, selection => selection.user)
  selections: Selection[];

  @OneToMany(() => RolePermission, rolePermission => rolePermission.grantedBy)
  grantedPermissions: RolePermission[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs: AuditLog[];

  @OneToOne(() => UserProfile, profile => profile.user, { cascade: true })
  profile: UserProfile;
}