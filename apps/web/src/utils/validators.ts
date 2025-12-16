export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export class FormValidator {
  // Validate student ID
  static validateStudentId(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, message: '请输入学号' };
    }

    if (value.length < 5 || value.length > 20) {
      return { valid: false, message: '学号长度必须在5-20个字符之间' };
    }

    if (!/^[A-Za-z0-9]+$/.test(value)) {
      return { valid: false, message: '学号只能包含字母和数字' };
    }

    return { valid: true };
  }

  // Validate username
  static validateUsername(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, message: '请输入用户名' };
    }

    if (value.length < 3 || value.length > 50) {
      return { valid: false, message: '用户名长度必须在3-50个字符之间' };
    }

    return { valid: true };
  }

  // Validate email
  static validateEmail(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, message: '请输入邮箱地址' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: '请输入有效的邮箱地址' };
    }

    return { valid: true };
  }

  // Validate password
  static validatePassword(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, message: '请输入密码' };
    }

    if (value.length < 8) {
      return { valid: false, message: '密码长度至少8位' };
    }

    if (value.length > 100) {
      return { valid: false, message: '密码长度不能超过100位' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      return { valid: false, message: '密码必须包含至少一个小写字母' };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      return { valid: false, message: '密码必须包含至少一个大写字母' };
    }

    // Check for at least one digit
    if (!/\d/.test(value)) {
      return { valid: false, message: '密码必须包含至少一个数字' };
    }

    // Check for at least one special character
    if (!/[@$!%*?&]/.test(value)) {
      return { valid: false, message: '密码必须包含至少一个特殊字符(@$!%*?&)' };
    }

    return { valid: true };
  }

  // Validate confirm password
  static validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword || confirmPassword.trim() === '') {
      return { valid: false, message: '请确认密码' };
    }

    if (password !== confirmPassword) {
      return { valid: false, message: '两次输入的密码不一致' };
    }

    return { valid: true };
  }

  // Validate first name
  static validateFirstName(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: false, message: '请输入姓名' };
    }

    if (value.length > 100) {
      return { valid: false, message: '姓名长度不能超过100个字符' };
    }

    if (!/^[A-Za-z\u4e00-\u9fa5\s]+$/.test(value)) {
      return { valid: false, message: '姓名只能包含中英文字符和空格' };
    }

    return { valid: true };
  }

  // Validate last name (optional)
  static validateLastName(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { valid: true }; // Last name is optional
    }

    if (value.length > 100) {
      return { valid: false, message: '姓氏长度不能超过100个字符' };
    }

    if (!/^[A-Za-z\u4e00-\u9fa5\s]*$/.test(value)) {
      return { valid: false, message: '姓氏只能包含中英文字符和空格' };
    }

    return { valid: true };
  }

  // Get password strength indicator
  static getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    if (/[A-Za-z].*[A-Za-z]/.test(password)) score++;
    if (/\d.*\d/.test(password)) score++;

    if (score <= 2) {
      return { score, label: '弱', color: '#ff4d4f' };
    } else if (score <= 4) {
      return { score, label: '中', color: '#faad14' };
    } else if (score <= 6) {
      return { score, label: '强', color: '#52c41a' };
    } else {
      return { score, label: '很强', color: '#1890ff' };
    }
  }
}