import { IsEmail, IsString, IsEnum, IsOptional, Length, Matches, Transform } from 'class-validator';
import { UserRole, UserStatus } from '../models/User';
import { sanitize } from 'sanitize-html';

export class RegisterDto {
  @IsString()
  @Length(5, 20, { message: '学号长度必须在5-20个字符之间' })
  @Matches(/^[A-Za-z0-9]+$/, { message: '学号只能包含字母和数字' })
  @Transform(value => sanitize(value.trim()))
  studentId: string;

  @IsString()
  @Length(3, 50, { message: '用户名长度必须在3-50个字符之间' })
  @Transform(value => sanitize(value.trim()))
  username: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @Transform(value => sanitize(value.trim().toLowerCase()))
  email: string;

  @IsString()
  @Length(8, 100, { message: '密码长度必须在8-100个字符之间' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'
  })
  password: string;

  @IsString()
  @Length(1, 100, { message: '姓名长度必须在1-100个字符之间' })
  @Matches(/^[A-Za-z\u4e00-\u9fa5\s]+$/, { message: '姓名只能包含中英文字符和空格' })
  @Transform(value => sanitize(value.trim()))
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(0, 100, { message: '姓氏长度不能超过100个字符' })
  @Matches(/^[A-Za-z\u4e00-\u9fa5\s]*$/, { message: '姓氏只能包含中英文字符和空格' })
  @Transform(value => sanitize(value ? value.trim() : ''))
  lastName?: string;
}

export class CreateUserDto {
  @IsString()
  @Length(3, 50, { message: '用户名长度必须在3-50个字符之间' })
  username: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @Length(6, 100, { message: '密码长度必须在6-100个字符之间' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'
  })
  password: string;

  @IsOptional()
  @IsString()
  @Length(5, 20, { message: '学号长度必须在5-20个字符之间' })
  @Matches(/^[A-Za-z0-9]+$/, { message: '学号只能包含字母和数字' })
  studentId?: string;

  @IsEnum(UserRole, { message: '用户角色必须是student或admin' })
  role: UserRole;

  @IsEnum(UserStatus, { message: '用户状态必须是active、inactive或suspended' })
  status: UserStatus;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 50, { message: '用户名长度必须在3-50个字符之间' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20, { message: '学号长度必须在5-20个字符之间' })
  @Matches(/^[A-Za-z0-9]+$/, { message: '学号只能包含字母和数字' })
  studentId?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: '用户角色必须是student或admin' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: '用户状态必须是active、inactive或suspended' })
  status?: UserStatus;
}

export class ChangePasswordDto {
  @IsString()
  @Length(6, 100, { message: '当前密码长度必须在6-100个字符之间' })
  currentPassword: string;

  @IsString()
  @Length(6, 100, { message: '新密码长度必须在6-100个字符之间' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '新密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'
  })
  newPassword: string;

  @IsString()
  @Length(6, 100, { message: '确认密码长度必须在6-100个字符之间' })
  confirmPassword: string;
}