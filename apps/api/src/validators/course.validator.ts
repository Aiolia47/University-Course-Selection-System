import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Length,
  Min,
  Max,
  Matches,
  IsArray,
  IsInt,
  ArrayNotEmpty,
  ValidateNested
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CourseStatus, DayOfWeek } from '../models';

export class CourseScheduleDto {
  @IsArray()
  @IsEnum(DayOfWeek, { each: true, message: '星期必须是有效的枚举值' })
  dayOfWeek: DayOfWeek[];

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: '开始时间格式必须为HH:MM' })
  startTime: string;

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: '结束时间格式必须为HH:MM' })
  endTime: string;

  @IsString()
  @Length(1, 100, { message: '地点长度必须在1-100个字符之间' })
  location: string;

  @IsArray()
  @IsInt({ each: true, message: '周数必须是整数' })
  @Min(1, { each: true, message: '周数最小为1' })
  @Max(16, { each: true, message: '周数最大为16' })
  weeks: number[];
}

export class BatchCourseOperationDto {
  @IsEnum(['create', 'update', 'delete'], { message: '批量操作必须是create、update或delete' })
  operation: 'create' | 'update' | 'delete';

  @IsOptional()
  @IsArray()
  courses?: CreateCourseDto[];

  @IsOptional()
  @IsArray()
  courseIds?: string[];
}

export class CreateCourseDto {
  @IsString()
  @Length(3, 20, { message: '课程代码长度必须在3-20个字符之间' })
  @Matches(/^[A-Z0-9]+$/, { message: '课程代码只能包含大写字母和数字' })
  code: string;

  @IsString()
  @Length(3, 255, { message: '课程名称长度必须在3-255个字符之间' })
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: '课程描述不能超过1000个字符' })
  description?: string;

  @IsNumber({}, { message: '学分必须是数字' })
  @Min(1, { message: '学分最少为1' })
  @Max(10, { message: '学分最多为10' })
  credits: number;

  @IsString()
  @Length(2, 100, { message: '教师姓名长度必须在2-100个字符之间' })
  teacher: string;

  @IsNumber({}, { message: '容量必须是数字' })
  @Min(1, { message: '容量最少为1' })
  @Max(1000, { message: '容量最多为1000' })
  capacity: number;

  @IsOptional()
  @IsEnum(CourseStatus, { message: '课程状态必须是draft、published、cancelled或completed' })
  status?: CourseStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseScheduleDto)
  schedules?: CourseScheduleDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: '先修课程代码必须是字符串' })
  prerequisites?: string[];
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @Length(3, 20, { message: '课程代码长度必须在3-20个字符之间' })
  @Matches(/^[A-Z0-9]+$/, { message: '课程代码只能包含大写字母和数字' })
  code?: string;

  @IsOptional()
  @IsString()
  @Length(3, 255, { message: '课程名称长度必须在3-255个字符之间' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: '课程描述不能超过1000个字符' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: '学分必须是数字' })
  @Min(1, { message: '学分最少为1' })
  @Max(10, { message: '学分最多为10' })
  credits?: number;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: '教师姓名长度必须在2-100个字符之间' })
  teacher?: string;

  @IsOptional()
  @IsNumber({}, { message: '容量必须是数字' })
  @Min(1, { message: '容量最少为1' })
  @Max(1000, { message: '容量最多为1000' })
  capacity?: number;

  @IsOptional()
  @IsEnum(CourseStatus, { message: '课程状态必须是draft、published、cancelled或completed' })
  status?: CourseStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseScheduleDto)
  schedules?: CourseScheduleDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: '先修课程代码必须是字符串' })
  prerequisites?: string[];
}

export class QueryCoursesDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: '搜索关键词长度必须在1-50个字符之间' })
  search?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20, { message: '教师名称长度必须在1-20个字符之间' })
  teacher?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'cancelled', 'completed'], { message: '无效的课程状态' })
  status?: CourseStatus;

  @IsOptional()
  @IsNumber({}, { message: '最小学分必须是数字' })
  @Min(1, { message: '最小学分最少为1' })
  minCredits?: number;

  @IsOptional()
  @IsNumber({}, { message: '最大学分必须是数字' })
  @Max(10, { message: '最大学分最多为10' })
  maxCredits?: number;

  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码最少为1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量最少为1' })
  @Max(100, { message: '每页数量最多为100' })
  limit?: number;

  @IsOptional()
  @IsEnum(['code', 'name', 'teacher', 'credits', 'createdAt', 'updatedAt'], { message: '无效的排序字段' })
  sortBy?: 'code' | 'name' | 'teacher' | 'credits' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: '排序方向必须是ASC或DESC' })
  sortOrder?: 'ASC' | 'DESC';
}