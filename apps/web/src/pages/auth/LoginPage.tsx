import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Alert,
  Typography,
  Divider,
  Space
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { AppDispatch } from '../../stores/store';
import { loginAsync, clearError } from '../../stores/slices/authSlice';
import { RootState } from '../../stores/rootReducer';
import styles from './LoginPage.module.css';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm<LoginFormValues>();
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear error when component unmounts or form values change
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setLoginAttempts(prev => prev + 1);
      await dispatch(loginAsync({
        username: values.username.trim(),
        password: values.password,
        rememberMe: values.rememberMe
      })).unwrap();

      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by Redux state
      console.error('Login failed:', error);
    }
  };

  const handleFormChange = () => {
    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    // Store preference in localStorage
    localStorage.setItem('rememberMe', checked.toString());
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Title level={2} className={styles.loginTitle}>
            用户登录
          </Title>
          <Text type="secondary">
            登录以访问您的课程选课系统
          </Text>
        </div>

        {error && (
          <Alert
            message="登录失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => dispatch(clearError())}
            className={styles.errorAlert}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
          size="large"
          className={styles.loginForm}
          initialValues={{
            rememberMe: localStorage.getItem('rememberMe') === 'true'
          }}
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: '请输入用户名、学号或邮箱!'
              },
              {
                min: 3,
                message: '用户名至少需要3个字符!'
              },
              {
                max: 100,
                message: '用户名不能超过100个字符!'
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名/学号/邮箱"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: '请输入密码!'
              },
              {
                min: 6,
                message: '密码至少需要6个字符!'
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
              iconRender={(visible) => (
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              )}
            />
          </Form.Item>

          <Form.Item>
            <div className={styles.loginOptions}>
              <Checkbox
                name="rememberMe"
                onChange={(e) => handleRememberMeChange(e.target.checked)}
              >
                记住登录状态
              </Checkbox>
              <Link to="/auth/forgot-password" className={styles.forgotPasswordLink}>
                忘记密码?
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              className={styles.loginButton}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className={styles.registerLink}>
          <Text type="secondary">
            还没有账户?{' '}
            <Link to="/auth/register">
              立即注册
            </Link>
          </Text>
        </div>

        {loginAttempts >= 3 && (
          <Alert
            message="登录提示"
            description="如果多次登录失败，请检查用户名和密码是否正确，或联系系统管理员。"
            type="info"
            showIcon
            className={styles.infoAlert}
          />
        )}

        <div className={styles.loginFooter}>
          <Space direction="vertical" size="small" align="center">
            <Text type="secondary" className={styles.footerText}>
              支持使用用户名、学号或邮箱登录
            </Text>
            <Text type="secondary" className={styles.footerText}>
              系统管理员邮箱: admin@bmad7.edu
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;