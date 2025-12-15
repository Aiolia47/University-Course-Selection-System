import { IsEmail, IsString, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { UserRole, UserStatus } from '../models/User';

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
  @Matches(/^[0-9]+$/, { message: '学号只能包含数字' })
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
  @Matches(/^[0-9]+$/, { message: '学号只能包含数字' })
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