import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
  return (
    <AntFooter style={{
      textAlign: 'center',
      background: '#f0f2f5',
      borderTop: '1px solid #f0f0f0',
    }}>
      <Text type="secondary">
        BMAD7 课程选课系统 ©{new Date().getFullYear()} Created by BMAD7 Team
      </Text>
    </AntFooter>
  );
};

export default Footer;