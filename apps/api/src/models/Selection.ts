import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from './User';
import { Course } from './Course';

export enum SelectionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

@Entity('selections')
@Unique(['userId', 'courseId'])
@Index(['userId'])
@Index(['courseId'])
@Index(['status'])
export class Selection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({
    type: 'enum',
    enum: SelectionStatus,
    default: SelectionStatus.PENDING
  })
  status: SelectionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'selected_at' })
  selectedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.selections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, course => course.selections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;
}