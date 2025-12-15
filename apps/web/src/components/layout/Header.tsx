import React from 'react';
import { Layout, Typography, Space, Avatar, Dropdown, Button } from 'antd';
import { UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { toggleSidebar } from '@/stores/slices/uiSlice';
import { logoutAsync } from '@/stores/slices/authSlice';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = () => {
    dispatch(logoutAsync());
    navigate('/auth/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader style={{
      padding: '0 24px',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Space align="center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          style={{ fontSize: 16, width: 48, height: 48 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          BMAD7 课程选课系统
        </Title>
      </Space>

      <Space align="center">
        <span>欢迎，{user?.firstName || user?.username}</span>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            size="large"
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
            src={user?.avatar}
          />
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;