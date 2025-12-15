import { IsString, IsNumber, IsEnum, IsOptional, Length, Min, Max, Matches } from 'class-validator';
import { CourseStatus } from '../models/Course';

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

  @IsEnum(CourseStatus, { message: '课程状态必须是draft、published、cancelled或completed' })
  status: CourseStatus;
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
}