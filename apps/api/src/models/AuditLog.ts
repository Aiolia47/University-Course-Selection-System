import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  USER_LOGIN = 'user_login',
  USER_LOGIN_FAILED = 'user_login_failed',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  SELECT_COURSE = 'select_course',
  CANCEL_SELECTION = 'cancel_selection',
  CONFIRM_SELECTION = 'confirm_selection'
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['resource'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ type: 'json', nullable: true })
  oldValues: object | null;

  @Column({ type: 'json', nullable: true })
  newValues: object | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}