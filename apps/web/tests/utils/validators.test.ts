import { FormValidator } from '../../../src/utils/validators';

describe('FormValidator', () => {
  describe('validateStudentId', () => {
    it('should validate correct student ID', () => {
      const result = FormValidator.validateStudentId('2024001');
      expect(result.valid).toBe(true);
    });

    it('should reject empty student ID', () => {
      const result = FormValidator.validateStudentId('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入学号');
    });

    it('should reject too short student ID', () => {
      const result = FormValidator.validateStudentId('1234');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('学号长度必须在5-20个字符之间');
    });

    it('should reject too long student ID', () => {
      const result = FormValidator.validateStudentId('123456789012345678901');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('学号长度必须在5-20个字符之间');
    });

    it('should reject student ID with special characters', () => {
      const result = FormValidator.validateStudentId('2024-001');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('学号只能包含字母和数字');
    });
  });

  describe('validateUsername', () => {
    it('should validate correct username', () => {
      const result = FormValidator.validateUsername('john_doe');
      expect(result.valid).toBe(true);
    });

    it('should reject empty username', () => {
      const result = FormValidator.validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入用户名');
    });

    it('should reject too short username', () => {
      const result = FormValidator.validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('用户名长度必须在3-50个字符之间');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = FormValidator.validateEmail('test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject empty email', () => {
      const result = FormValidator.validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入邮箱地址');
    });

    it('should reject invalid email format', () => {
      const result = FormValidator.validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入有效的邮箱地址');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = FormValidator.validatePassword('Password123!');
      expect(result.valid).toBe(true);
    });

    it('should reject empty password', () => {
      const result = FormValidator.validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入密码');
    });

    it('should reject short password', () => {
      const result = FormValidator.validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码长度至少8位');
    });

    it('should reject password without lowercase letter', () => {
      const result = FormValidator.validatePassword('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含至少一个小写字母');
    });

    it('should reject password without uppercase letter', () => {
      const result = FormValidator.validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含至少一个大写字母');
    });

    it('should reject password without number', () => {
      const result = FormValidator.validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含至少一个数字');
    });

    it('should reject password without special character', () => {
      const result = FormValidator.validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码必须包含至少一个特殊字符(@$!%*?&)');
    });
  });

  describe('validateConfirmPassword', () => {
    it('should validate matching passwords', () => {
      const result = FormValidator.validateConfirmPassword('Password123!', 'Password123!');
      expect(result.valid).toBe(true);
    });

    it('should reject empty confirm password', () => {
      const result = FormValidator.validateConfirmPassword('Password123!', '');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请确认密码');
    });

    it('should reject non-matching passwords', () => {
      const result = FormValidator.validateConfirmPassword('Password123!', 'DifferentPassword123!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('两次输入的密码不一致');
    });
  });

  describe('validateFirstName', () => {
    it('should validate correct first name', () => {
      const result = FormValidator.validateFirstName('John');
      expect(result.valid).toBe(true);
    });

    it('should validate Chinese name', () => {
      const result = FormValidator.validateFirstName('张三');
      expect(result.valid).toBe(true);
    });

    it('should reject empty first name', () => {
      const result = FormValidator.validateFirstName('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入姓名');
    });

    it('should reject too long first name', () => {
      const result = FormValidator.validateFirstName('A'.repeat(101));
      expect(result.valid).toBe(false);
      expect(result.message).toBe('姓名长度不能超过100个字符');
    });

    it('should reject name with invalid characters', () => {
      const result = FormValidator.validateFirstName('John@Doe');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('姓名只能包含中英文字符和空格');
    });
  });

  describe('validateLastName', () => {
    it('should validate correct last name', () => {
      const result = FormValidator.validateLastName('Doe');
      expect(result.valid).toBe(true);
    });

    it('should allow empty last name', () => {
      const result = FormValidator.validateLastName('');
      expect(result.valid).toBe(true);
    });

    it('should reject too long last name', () => {
      const result = FormValidator.validateLastName('A'.repeat(101));
      expect(result.valid).toBe(false);
      expect(result.message).toBe('姓氏长度不能超过100个字符');
    });
  });

  describe('getPasswordStrength', () => {
    it('should return weak strength for simple password', () => {
      const result = FormValidator.getPasswordStrength('Password1');
      expect(result.label).toBe('弱');
      expect(result.color).toBe('#ff4d4f');
    });

    it('should return medium strength for moderate password', () => {
      const result = FormValidator.getPasswordStrength('Password123');
      expect(result.label).toBe('中');
      expect(result.color).toBe('#faad14');
    });

    it('should return strong strength for good password', () => {
      const result = FormValidator.getPasswordStrength('Password123!');
      expect(result.label).toBe('强');
      expect(result.color).toBe('#52c41a');
    });

    it('should return very strong strength for excellent password', () => {
      const result = FormValidator.getPasswordStrength('VeryStrongPassword123!@#');
      expect(['很强', '强']).toContain(result.label);
    });
  });
});