import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { usePermissions } from '../../hooks/usePermissions';

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  resource?: string;
  action?: string;
  roles?: string[];
  children?: MenuItem[];
  type?: 'group';
  danger?: boolean;
  hidden?: boolean;
}

interface ProtectedMenuProps {
  items: MenuItem[];
  mode?: MenuProps['mode'];
  theme?: MenuProps['theme'];
  style?: React.CSSProperties;
  onSelect?: (info: { key: string; item: MenuItem }) => void;
  onOpenChange?: (openKeys: string[]) => void;
  selectedKeys?: string[];
  defaultOpenKeys?: string[];
  inlineCollapsed?: boolean;
}

/**
 * Menu component that filters items based on user permissions
 */
export const ProtectedMenu: React.FC<ProtectedMenuProps> = ({
  items,
  mode = 'vertical',
  theme = 'light',
  style,
  onSelect,
  onOpenChange,
  selectedKeys,
  defaultOpenKeys,
  inlineCollapsed = false,
}) => {
  const { hasPermission, hasRole } = usePermissions();

  /**
   * Recursively filter menu items based on permissions
   */
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => {
        // Skip hidden items
        if (item.hidden) {
          return false;
        }

        // Check role requirements
        if (item.roles && item.roles.length > 0) {
          const hasRequiredRole = item.roles.some(role => hasRole(role));
          if (!hasRequiredRole) {
            return false;
          }
        }

        // Check permission requirements
        if (item.resource && item.action) {
          if (!hasPermission(item.resource, item.action)) {
            return false;
          }
        }

        return true;
      })
      .map(item => {
        // Recursively filter children if they exist
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterMenuItems(item.children);

          // If no children remain after filtering, don't include this item
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  /**
   * Convert menu items to Ant Design Menu format
   */
  const convertToAntdMenuItems = (items: MenuItem[]): MenuProps['items'] => {
    return items.map(item => {
      const antdItem: any = {
        key: item.key,
        label: item.label,
        icon: item.icon,
        danger: item.danger,
      };

      if (item.children && item.children.length > 0) {
        antdItem.children = convertToAntdMenuItems(item.children);
      }

      // Group items
      if (item.type === 'group') {
        antdItem.type = 'group';
      }

      return antdItem;
    });
  };

  const filteredItems = filterMenuItems(items);
  const antdMenuItems = convertToAntdMenuItems(filteredItems);

  const handleSelect = (info: { key: string }) => {
    const selectedItem = items.find(item => item.key === info.key);
    if (selectedItem && onSelect) {
      onSelect({
        key: info.key,
        item: selectedItem,
      });
    }
  };

  return (
    <Menu
      mode={mode}
      theme={theme}
      style={style}
      items={antdMenuItems}
      onSelect={handleSelect}
      onOpenChange={onOpenChange}
      selectedKeys={selectedKeys}
      defaultOpenKeys={defaultOpenKeys}
      inlineCollapsed={inlineCollapsed}
    />
  );
};

/**
 * Hook for getting filtered menu items
 */
export const useFilteredMenuItems = (items: MenuItem[]): MenuItem[] => {
  const { hasPermission, hasRole } = usePermissions();

  return React.useMemo(() => {
    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => {
          if (item.hidden) return false;

          if (item.roles && item.roles.length > 0) {
            const hasRequiredRole = item.roles.some(role => hasRole(role));
            if (!hasRequiredRole) return false;
          }

          if (item.resource && item.action) {
            if (!hasPermission(item.resource, item.action)) return false;
          }

          return true;
        })
        .map(item => {
          if (item.children && item.children.length > 0) {
            const filteredChildren = filterItems(item.children);
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }
          return item;
        })
        .filter((item): item is MenuItem => item !== null);
    };

    return filterItems(items);
  }, [items, hasPermission, hasRole]);
};

/**
 * Default menu configuration for the application
 */
export const defaultMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: '🏠',
    path: '/dashboard',
    roles: ['admin', 'student'],
  },
  {
    key: 'courses',
    label: '课程管理',
    icon: '📚',
    resource: 'course',
    action: 'read',
    roles: ['admin', 'student'],
    children: [
      {
        key: 'course-list',
        label: '课程列表',
        path: '/courses',
        resource: 'course',
        action: 'list',
      },
      {
        key: 'course-create',
        label: '创建课程',
        path: '/courses/create',
        resource: 'course',
        action: 'create',
        roles: ['admin'],
      },
    ],
  },
  {
    key: 'selections',
    label: '选课管理',
    icon: '📝',
    roles: ['admin', 'student'],
    children: [
      {
        key: 'my-selections',
        label: '我的选课',
        path: '/selections/my',
        resource: 'selection',
        action: 'read',
        roles: ['student'],
      },
      {
        key: 'selection-manage',
        label: '选课管理',
        path: '/selections/manage',
        resource: 'selection',
        action: 'manage',
        roles: ['admin'],
      },
    ],
  },
  {
    key: 'users',
    label: '用户管理',
    icon: '👥',
    resource: 'user',
    action: 'manage',
    roles: ['admin'],
    children: [
      {
        key: 'user-list',
        label: '用户列表',
        path: '/users',
        resource: 'user',
        action: 'list',
      },
      {
        key: 'user-create',
        label: '创建用户',
        path: '/users/create',
        resource: 'user',
        action: 'create',
      },
    ],
  },
  {
    key: 'permissions',
    label: '权限管理',
    icon: '🔐',
    resource: 'permission',
    action: 'assign',
    roles: ['admin'],
    children: [
      {
        key: 'permission-list',
        label: '权限列表',
        path: '/permissions',
        resource: 'permission',
        action: 'list',
      },
      {
        key: 'role-permissions',
        label: '角色权限',
        path: '/permissions/roles',
        resource: 'role',
        action: 'read',
      },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: '⚙️',
    resource: 'system',
    action: 'read',
    roles: ['admin'],
    children: [
      {
        key: 'system-info',
        label: '系统信息',
        path: '/system/info',
        resource: 'system',
        action: 'read',
      },
      {
        key: 'system-manage',
        label: '系统管理',
        path: '/system/manage',
        resource: 'system',
        action: 'manage',
      },
    ],
  },
  {
    key: 'profile',
    label: '个人设置',
    icon: '👤',
    resource: 'user',
    action: 'update',
    roles: ['admin', 'student'],
    children: [
      {
        key: 'profile-edit',
        label: '编辑资料',
        path: '/profile/edit',
        resource: 'user',
        action: 'update',
      },
      {
        key: 'password-change',
        label: '修改密码',
        path: '/profile/password',
        resource: 'user',
        action: 'update',
      },
    ],
  },
];

export default ProtectedMenu;