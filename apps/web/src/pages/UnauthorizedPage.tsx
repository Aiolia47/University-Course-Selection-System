import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <Result
      status="403"
      icon={<ExclamationCircleOutlined />}
      title="403 - 访问被拒绝"
      subTitle="抱歉，您没有权限访问此页面。请使用具有适当权限的账户登录。"
      extra={[
        <Button type="primary" key="dashboard" onClick={handleBackToHome}>
          返回首页
        </Button>,
        <Button key="login" onClick={handleGoToLogin}>
          重新登录
        </Button>
      ]}
    />
  );
};

export default UnauthorizedPage;