import React from 'react';
import { Card, Tag, Space, Tooltip, Badge, List, Descriptions } from 'antd';
import {
  SafetyOutlined,
  UserOutlined,
  BookOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { usePermissions } from '../../hooks/usePermissions';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: any;
}

interface PermissionViewerProps {
  permissions?: Permission[];
  title?: string;
  showDetails?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}

/**
 * Component to display user permissions in a readable format
 */
export const PermissionViewer: React.FC<PermissionViewerProps> = ({
  permissions,
  title = '我的权限',
  showDetails = true,
  compact = false,
  style,
}) => {
  const { userPermissions, userRole, isAdmin, isStudent } = usePermissions();

  const displayPermissions = permissions || userPermissions;

  // Group permissions by resource
  const groupedPermissions = displayPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get resource icon
  const getResourceIcon = (resource: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      user: <UserOutlined />,
      course: <BookOutlined />,
      selection: <SettingOutlined />,
      permission: <SafetyOutlined />,
      system: <SettingOutlined />,
      role: <UserOutlined />,
    };
    return iconMap[resource] || <EyeOutlined />;
  };

  // Get action color
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: 'green',
      read: 'blue',
      update: 'orange',
      delete: 'red',
      list: 'cyan',
      manage: 'purple',
      assign: 'magenta',
      revoke: 'volcano',
    };
    return colorMap[action] || 'default';
  };

  if (compact) {
    return (
      <Space wrap>
        {displayPermissions.map(permission => (
          <Tooltip key={permission.id} title={permission.description}>
            <Tag
              icon={getResourceIcon(permission.resource)}
              color={getActionColor(permission.action)}
            >
              {permission.resource}:{permission.action}
            </Tag>
          </Tooltip>
        ))}
      </Space>
    );
  }

  return (
    <Card
      title={
        <Space>
          <SafetyOutlined />
          <span>{title}</span>
          <Badge
            count={displayPermissions.length}
            style={{ backgroundColor: '#52c41a' }}
          />
        </Space>
      }
      style={style}
    >
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="当前角色">
          <Tag color={userRole === 'admin' ? 'red' : 'blue'}>
            {userRole === 'admin' ? '管理员' : '学生'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="权限数量">
          <Badge count={displayPermissions.length} showZero />
        </Descriptions.Item>
      </Descriptions>

      {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
        <Card
          key={resource}
          size="small"
          title={
            <Space>
              {getResourceIcon(resource)}
              <span>{resource.toUpperCase()}</span>
              <Badge count={resourcePermissions.length} size="small" />
            </Space>
          }
          style={{ marginBottom: 8 }}
        >
          <List
            size="small"
            dataSource={resourcePermissions}
            renderItem={(permission) => (
              <List.Item style={{ padding: '4px 0' }}>
                <Space>
                  <Tag color={getActionColor(permission.action)}>
                    {permission.action}
                  </Tag>
                  <span style={{ color: '#666' }}>
                    {permission.description}
                  </span>
                  {permission.conditions && permission.conditions.length > 0 && (
                    <Tooltip title="此权限有条件限制">
                      <span style={{ color: '#faad14' }}>🔒</span>
                    </Tooltip>
                  )}
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ))}
    </Card>
  );
};

/**
 * Simple permission badge component
 */
export const PermissionBadge: React.FC<{
  resource: string;
  action: string;
  hasPermission: boolean;
  showIcon?: boolean;
}> = ({ resource, action, hasPermission, showIcon = true }) => {
  const getResourceIcon = (resource: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      user: <UserOutlined />,
      course: <BookOutlined />,
      selection: <SettingOutlined />,
      permission: <SafetyOutlined />,
      system: <SettingOutlined />,
    };
    return iconMap[resource] || <EyeOutlined />;
  };

  return (
    <Tooltip title={`${resource}:${action} - ${hasPermission ? '有权限' : '无权限'}`}>
      <Tag
        icon={showIcon && getResourceIcon(resource)}
        color={hasPermission ? 'green' : 'default'}
        style={{
          opacity: hasPermission ? 1 : 0.5,
          textDecoration: hasPermission ? 'none' : 'line-through',
        }}
      >
        {resource}:{action}
      </Tag>
    </Tooltip>
  );
};

/**
 * Permission status card for dashboard
 */
export const PermissionStatusCard: React.FC = () => {
  const {
    userPermissions,
    userRole,
    isAdmin,
    isStudent,
    canAccess,
    hasPermission
  } = usePermissions();

  const getPermissionSummary = () => {
    const summary = {
      total: userPermissions.length,
      byResource: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    };

    userPermissions.forEach(permission => {
      summary.byResource[permission.resource] = (summary.byResource[permission.resource] || 0) + 1;
      summary.byAction[permission.action] = (summary.byAction[permission.action] || 0) + 1;
    });

    return summary;
  };

  const summary = getPermissionSummary();

  return (
    <Card title="权限概览" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <strong>角色:</strong>
          <Tag color={userRole === 'admin' ? 'red' : 'blue'} style={{ marginLeft: 8 }}>
            {userRole === 'admin' ? '管理员' : '学生'}
          </Tag>
        </div>

        <div>
          <strong>总权限数:</strong>
          <Badge count={summary.total} style={{ marginLeft: 8 }} />
        </div>

        <div>
          <strong>权限分类:</strong>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(summary.byResource).map(([resource, count]) => (
              <Tag key={resource} color="blue">
                {resource}: {count}
              </Tag>
            ))}
          </div>
        </div>

        <div>
          <strong>操作权限:</strong>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(summary.byAction).map(([action, count]) => (
              <Tag key={action} color="green">
                {action}: {count}
              </Tag>
            ))}
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default PermissionViewer;