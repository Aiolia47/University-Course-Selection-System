import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { message } from 'antd';
import { RegisterPage } from '../../../src/pages/auth/RegisterPage';
import { authService } from '../../../src/services/authService';
import { FormValidator } from '../../../src/utils/validators';

// Mock the dependencies
jest.mock('../../../src/services/authService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock Ant Design message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={{}}>
      <ConfigProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </ConfigProvider>
    </Provider>
  );
};

describe('RegisterPage', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form rendering', () => {
    it('should render all form fields', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      expect(screen.getByLabelText('学号')).toBeInTheDocument();
      expect(screen.getByLabelText('用户名')).toBeInTheDocument();
      expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument();
      expect(screen.getByLabelText('姓名')).toBeInTheDocument();
      expect(screen.getByLabelText('姓氏')).toBeInTheDocument();
      expect(screen.getByLabelText('密码')).toBeInTheDocument();
      expect(screen.getByLabelText('确认密码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '立即注册' })).toBeInTheDocument();
    });

    it('should show correct placeholder text', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('请输入学号')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入邮箱地址')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入姓氏（可选）')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should validate student ID', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const studentIdInput = screen.getByPlaceholderText('请输入学号');

      // Test empty student ID
      fireEvent.blur(studentIdInput);
      await waitFor(() => {
        expect(screen.getByText('请输入学号')).toBeInTheDocument();
      });

      // Test invalid student ID (too short)
      fireEvent.change(studentIdInput, { target: { value: '123' } });
      await waitFor(() => {
        expect(screen.getByText('学号长度必须在5-20个字符之间')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('请输入邮箱地址');

      // Test invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('请输入密码');

      // Test weak password
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/密码/)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('请输入密码');
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码');

      // Set password
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('请输入密码');

      // Test strong password
      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });

      await waitFor(() => {
        expect(screen.getByText('密码强度：')).toBeInTheDocument();
        expect(screen.getByText(/(强|很强)/)).toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    const validFormData = {
      studentId: '2024001',
      username: 'john_doe',
      email: 'john.doe@university.edu',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    it('should submit form successfully with valid data', async () => {
      mockAuthService.register.mockResolvedValue({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: 'user-id',
            studentId: '2024001',
            username: 'john_doe',
            email: 'john.doe@university.edu',
            role: 'student',
            status: 'active',
            profile: {
              id: 'profile-id',
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        }
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        const input = screen.getByLabelText(field) || screen.getByPlaceholderText(value);
        fireEvent.change(input, { target: { value } });
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: '立即注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          studentId: '2024001',
          username: 'john_doe',
          email: 'john.doe@university.edu',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password123!'
        });
      });

      expect(message.success).toHaveBeenCalledWith('注册成功！即将跳转到登录页面...');
    });

    it('should handle registration failure', async () => {
      const errorMessage = '学号已存在';
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        const input = screen.getByLabelText(field) || screen.getByPlaceholderText(value);
        fireEvent.change(input, { target: { value } });
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: '立即注册' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should prevent multiple submissions', async () => {
      mockAuthService.register.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: '注册成功',
          data: { user: {} }
        }), 1000))
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill in form fields
      Object.entries(validFormData).forEach(([field, value]) => {
        const input = screen.getByLabelText(field) || screen.getByPlaceholderText(value);
        fireEvent.change(input, { target: { value } });
      });

      // Submit form multiple times
      const submitButton = screen.getByRole('button', { name: '立即注册' });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable submit button when form is invalid', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: '立即注册' });

      // Button should be disabled initially
      expect(submitButton).toBeDisabled();

      // Fill in partial form
      fireEvent.change(screen.getByPlaceholderText('请输入学号'), {
        target: { value: '2024001' }
      });

      // Button should still be disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe('User experience features', () => {
    it('should show loading state during submission', async () => {
      mockAuthService.register.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: '注册成功',
          data: { user: {} }
        }), 1000))
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      // Fill in minimal valid form
      fireEvent.change(screen.getByPlaceholderText('请输入学号'), { target: { value: '2024001' } });
      fireEvent.change(screen.getByPlaceholderText('请输入用户名'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('请输入邮箱地址'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('请输入姓名'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'Password123!' } });
      fireEvent.change(screen.getByPlaceholderText('请再次输入密码'), { target: { value: 'Password123!' } });

      const submitButton = screen.getByRole('button', { name: '立即注册' });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });
});