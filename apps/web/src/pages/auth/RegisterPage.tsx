import React, { useState, useCallback, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService, RegisterRequest } from '../../services/authService';
import { FormValidator } from '../../utils/validators';
import { debounce } from '../../utils/debounce';

const { Title, Text } = Typography;

interface FormErrors {
  studentId?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '弱',
    color: '#ff4d4f'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced validation handlers
  const debouncedValidateField = useCallback(
    debounce((field: string, value: string) => {
      validateField(field, value);
    }, 500),
    [form]
  );

  // Real-time validation handlers
  const validateField = useCallback((field: string, value: string) => {
    let validationResult = { valid: true };

    switch (field) {
      case 'studentId':
        validationResult = FormValidator.validateStudentId(value);
        break;
      case 'username':
        validationResult = FormValidator.validateUsername(value);
        break;
      case 'email':
        validationResult = FormValidator.validateEmail(value);
        break;
      case 'password':
        validationResult = FormValidator.validatePassword(value);
        if (validationResult.valid) {
          setPasswordStrength(FormValidator.getPasswordStrength(value));
        }
        break;
      case 'confirmPassword':
        const password = form.getFieldValue('password');
        validationResult = FormValidator.validateConfirmPassword(password, value);
        break;
      case 'firstName':
        validationResult = FormValidator.validateFirstName(value);
        break;
      case 'lastName':
        validationResult = FormValidator.validateLastName(value);
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: validationResult.valid ? undefined : validationResult.message
    }));

    // Check if form is valid for submit button
    checkFormValidity();

    return validationResult.valid;
  }, [form]);

  // Check form validity to enable/disable submit button
  const checkFormValidity = useCallback(() => {
    const values = form.getFieldsValue();
    const requiredFields = ['studentId', 'username', 'email', 'password', 'confirmPassword', 'firstName'];

    const allFieldsFilled = requiredFields.every(field => {
      const value = values[field];
      return value && value.toString().trim() !== '';
    });

    const hasNoErrors = requiredFields.every(field => !errors[field]);

    setSubmitDisabled(!allFieldsFilled || hasNoErrors === false);
  }, [form, errors]);

  // Handle field changes with debounced validation
  const handleFieldChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Immediate validation for critical fields
    if (['password', 'confirmPassword'].includes(field)) {
      validateField(field, value);
    } else {
      // Debounced validation for other fields
      debouncedValidateField(field, value);
    }

    // If password changes, revalidate confirm password
    if (field === 'password') {
      const confirmPassword = form.getFieldValue('confirmPassword');
      if (confirmPassword) {
        validateField('confirmPassword', confirmPassword);
      }
    }
  }, [form, validateField, debouncedValidateField]);

  // Form submission
  const handleSubmit = async (values: RegisterRequest) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Final validation before submission
      const fields = ['studentId', 'username', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
      let isValid = true;

      for (const field of fields) {
        if (!validateField(field, values[field as keyof RegisterRequest] || '')) {
          isValid = false;
        }
      }

      if (!isValid) {
        message.error('请修正表单中的错误后再提交');
        return;
      }

      // Remove confirmPassword from request
      const { confirmPassword, ...registerData } = values;

      await authService.register(registerData);

      message.success('注册成功！即将跳转到登录页面...');

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);

    } catch (error: any) {
      message.error(error.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Check form validity on mount and when errors change
  useEffect(() => {
    checkFormValidity();
  }, [checkFormValidity]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            学生注册
          </Title>
          <Text type="secondary">
            创建您的账户开始使用选课系统
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学号"
                validateStatus={errors.studentId ? 'error' : ''}
                help={errors.studentId}
                rules={[
                  { required: true, message: '请输入学号' },
                  { min: 5, max: 20, message: '学号长度必须在5-20个字符之间' }
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="请输入学号"
                  onChange={handleFieldChange('studentId')}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                validateStatus={errors.username ? 'error' : ''}
                help={errors.username}
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                  onChange={handleFieldChange('username')}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="邮箱地址"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email}
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              onChange={handleFieldChange('email')}
              allowClear
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="姓名"
                validateStatus={errors.firstName ? 'error' : ''}
                help={errors.firstName}
                rules={[
                  { required: true, message: '请输入姓名' },
                  { max: 100, message: '姓名长度不能超过100个字符' }
                ]}
              >
                <Input
                  placeholder="请输入姓名"
                  onChange={handleFieldChange('firstName')}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="姓氏"
                validateStatus={errors.lastName ? 'error' : ''}
                help={errors.lastName}
              >
                <Input
                  placeholder="请输入姓氏（可选）"
                  onChange={handleFieldChange('lastName')}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label="密码"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password}
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, max: 100, message: '密码长度必须在8-100个字符之间' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              onChange={handleFieldChange('password')}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          {passwordStrength.score > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">密码强度：</Text>
              <Text style={{ color: passwordStrength.color, fontWeight: 'bold' }}>
                {passwordStrength.label}
              </Text>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            validateStatus={errors.confirmPassword ? 'error' : ''}
            help={errors.confirmPassword}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              onChange={handleFieldChange('confirmPassword')}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={submitDisabled || loading}
              block
              style={{ height: '45px', fontSize: '16px' }}
            >
              {loading ? '注册中...' : '立即注册'}
            </Button>
          </Form.Item>

          <Divider>
            <Text type="secondary">已有账户？</Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/login">
              <Button type="link" size="large">
                立即登录
              </Button>
            </Link>
          </div>
        </Form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            注册即表示您同意我们的
            <a href="#" style={{ margin: '0 4px' }}>服务条款</a>
            和
            <a href="#" style={{ margin: '0 4px' }}>隐私政策</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};
