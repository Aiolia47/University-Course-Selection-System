import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          登录页面
        </Title>
        <p>登录功能将在后续实现</p>
      </Card>
    </div>
  );
};

export default LoginPage;