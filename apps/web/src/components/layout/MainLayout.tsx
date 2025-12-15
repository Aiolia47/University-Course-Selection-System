import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setScreenSize } from '@/stores/slices/uiSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

      if (width <= 480) screenSize = 'xs';
      else if (width <= 576) screenSize = 'sm';
      else if (width <= 768) screenSize = 'md';
      else if (width <= 992) screenSize = 'lg';
      else if (width <= 1200) screenSize = 'xl';
      else screenSize = 'xxl';

      dispatch(setScreenSize(screenSize));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
        <Header />
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          borderRadius: 6,
          minHeight: 'calc(100vh - 112px)',
        }}>
          <Outlet />
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default MainLayout;