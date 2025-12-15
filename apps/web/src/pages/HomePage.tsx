import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      title="欢迎使用 BMAD7 课程选课系统"
      subTitle="这是一个功能完整的课程选课管理系统"
      extra={[
        <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
          进入仪表板
        </Button>,
        <Button key="login" onClick={() => navigate('/auth/login')}>
          登录
        </Button>,
      ]}
    />
  );
};

export default HomePage;