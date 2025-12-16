import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { Course } from './Course';

@Entity('course_prerequisites')
@Unique(['courseId', 'prerequisiteCourseId'])
export class CoursePrerequisite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 36, name: 'prerequisite_course_id' })
  prerequisiteCourseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Course, course => course.prerequisites, { onDelete: 'CASCADE' })
  course: Course;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  prerequisiteCourse: Course;
}