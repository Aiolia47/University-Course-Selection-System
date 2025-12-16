import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Course } from './Course';

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7
}

@Entity('course_schedules')
@Index(['courseId'])
@Index(['dayOfWeek', 'startTime'])
export class CourseSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'course_id' })
  courseId: string;

  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'day_of_week'
  })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'time', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'json' })
  weeks: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, course => course.schedules, { onDelete: 'CASCADE' })
  course: Course;
}