import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Selection } from './Selection';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

@Entity('courses')
@Index(['code'])
@Index(['teacher'])
@Index(['status'])
@Index(['credits'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', unsigned: true })
  credits: number;

  @Column({ type: 'varchar', length: 100 })
  teacher: string;

  @Column({ type: 'int', unsigned: true, default: 1 })
  capacity: number;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'enrolled' })
  enrolled: number;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT
  })
  status: CourseStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Selection, selection => selection.course)
  selections: Selection[];
}