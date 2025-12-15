import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  BookOutlined,
  SelectionOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/hooks/redux';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程列表',
      children: [
        {
          key: '/courses',
          label: '所有课程',
        },
      ],
    },
    {
      key: '/selections',
      icon: <SelectionOutlined />,
      label: '我的选课',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // Get current selected key based on location
  const getSelectedKey = () => {
    const pathname = location.pathname;

    // Exact matches first
    if (menuItems.some(item => item.key === pathname)) {
      return pathname;
    }

    // Parent menu matches
    if (pathname.startsWith('/courses')) {
      return '/courses';
    }

    return '/dashboard';
  };

  return (
    <Sider
      collapsed={sidebarCollapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 16,
      }}>
        <h2 style={{ margin: 0, color: '#1677ff' }}>
          {sidebarCollapsed ? 'B7' : 'BMAD7'}
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;