import { IsString, IsEnum, IsOptional, IsUUID, Length } from 'class-validator';
import { SelectionStatus } from '../models/Selection';

export class CreateSelectionDto {
  @IsUUID('4', { message: '用户ID必须是有效的UUID' })
  userId: string;

  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  courseId: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '备注不能超过500个字符' })
  notes?: string;
}

export class UpdateSelectionDto {
  @IsOptional()
  @IsEnum(SelectionStatus, { message: '选课状态必须是pending、confirmed、cancelled或completed' })
  status?: SelectionStatus;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '备注不能超过500个字符' })
  notes?: string;
}

export class ConfirmSelectionDto {
  @IsUUID('4', { message: '选课记录ID必须是有效的UUID' })
  selectionId: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '确认备注不能超过500个字符' })
  notes?: string;
}

export class CancelSelectionDto {
  @IsUUID('4', { message: '选课记录ID必须是有效的UUID' })
  selectionId: string;

  @IsString()
  @Length(1, 500, { message: '取消原因必须在1-500个字符之间' })
  reason: string;
}

export class QuerySelectionsDto {
  @IsOptional()
  @IsUUID('4', { message: '用户ID必须是有效的UUID' })
  userId?: string;

  @IsOptional()
  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  courseId?: string;

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'], { message: '无效的选课状态' })
  status?: SelectionStatus;

  @IsOptional()
  @IsString()
  @Length(10, 10, { message: '开始日期格式必须为YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '开始日期格式必须为YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10, { message: '结束日期格式必须为YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '结束日期格式必须为YYYY-MM-DD' })
  endDate?: string;

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