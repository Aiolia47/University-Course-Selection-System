import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Checkbox,
  Space,
  Tag,
  message,
  Alert,
  Divider,
  Row,
  Col,
  Tree,
  Switch,
  Input,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  CopyOutlined,
  SaveOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import {
  fetchPermissionsAsync,
  fetchAllRolePermissionsAsync,
  replaceRolePermissionsAsync,
  selectPermissions,
  selectRolePermissions,
  selectPermissionLoading,
  selectPermissionError,
} from '../../stores/slices/permissionSlice';

const { Search } = Input;

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: any;
}

interface RolePermission {
  role: string;
  permissions: Permission[];
  totalPermissions: number;
}

interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
  permission?: Permission;
  isLeaf?: boolean;
}

interface RolePermissionConfigProps {
  visible: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export const RolePermissionConfig: React.FC<RolePermissionConfigProps> = ({
  visible,
  onClose,
  defaultRole = 'admin',
}) => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();

  // Redux state
  const permissions = useSelector(selectPermissions);
  const rolePermissions = useSelector(selectRolePermissions);
  const loading = useSelector(selectPermissionLoading);
  const error = useSelector(selectPermissionError);

  // Local state
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [mode, setMode] = useState<'tree' | 'table'>('tree');

  // Load data on mount and when visible
  useEffect(() => {
    if (visible && hasPermission('permission', 'read')) {
      dispatch(fetchPermissionsAsync());
      dispatch(fetchAllRolePermissionsAsync());
    }
  }, [visible, dispatch, hasPermission]);

  // Update checked keys when role changes
  useEffect(() => {
    const currentRolePermissions = rolePermissions.find(rp => rp.role === selectedRole);
    if (currentRolePermissions) {
      setCheckedKeys(currentRolePermissions.permissions.map(p => p.id));
    } else {
      setCheckedKeys([]);
    }
  }, [selectedRole, rolePermissions]);

  // Group permissions by resource for tree structure
  const getPermissionTreeData = (): TreeNode[] => {
    const groupedPermissions: Record<string, Permission[]> = {};

    // Group by resource
    permissions.forEach(permission => {
      if (!groupedPermissions[permission.resource]) {
        groupedPermissions[permission.resource] = [];
      }
      groupedPermissions[permission.resource].push(permission);
    });

    // Convert to tree nodes
    return Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => ({
      title: (
        <Space>
          <Tag color="blue">{resource}</Tag>
          <span style={{ color: '#666' }}>({resourcePermissions.length} 个权限)</span>
        </Space>
      ),
      key: `resource-${resource}`,
      children: resourcePermissions.map(permission => ({
        title: (
          <Space>
            <span>{permission.name}</span>
            <Tag color="green" size="small">{permission.action}</Tag>
            <Tooltip title={permission.description}>
              <span style={{ color: '#999', cursor: 'help' }}>ℹ️</span>
            </Tooltip>
          </Space>
        ),
        key: permission.id,
        permission,
        isLeaf: true,
      })),
    }));
  };

  // Filter tree data based on search
  const filterTreeData = (data: TreeNode[], searchValue: string): TreeNode[] => {
    if (!searchValue) return data;

    return data.reduce((acc: TreeNode[], node) => {
      let filteredChildren: TreeNode[] = [];

      // If node has children, filter them
      if (node.children) {
        filteredChildren = node.children.filter(child =>
          child.permission?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          child.permission?.description.toLowerCase().includes(searchValue.toLowerCase()) ||
          child.permission?.action.toLowerCase().includes(searchValue.toLowerCase())
        );

        // Include parent if any child matches
        if (filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
      }

      return acc;
    }, []);
  };

  const treeData = filterTreeData(getPermissionTreeData(), searchText);

  // Handle permission changes
  const handleCheck = (checkedKeysValue: any) => {
    setCheckedKeys(checkedKeysValue);
  };

  // Handle save permissions
  const handleSave = async () => {
    try {
      await dispatch(replaceRolePermissionsAsync({
        role: selectedRole,
        permissionIds: checkedKeys,
      })).unwrap();

      message.success(`${selectedRole} 角色权限保存成功`);
      dispatch(fetchAllRolePermissionsAsync()); // Refresh data
    } catch (error: any) {
      message.error(error.message || '保存权限失败');
    }
  };

  // Handle copy permissions from another role
  const handleCopyFromRole = async (fromRole: string) => {
    try {
      const fromRolePermissions = rolePermissions.find(rp => rp.role === fromRole);
      if (!fromRolePermissions) {
        message.error('源角色权限不存在');
        return;
      }

      await dispatch(replaceRolePermissionsAsync({
        role: selectedRole,
        permissionIds: fromRolePermissions.permissions.map(p => p.id),
      })).unwrap();

      message.success(`从 ${fromRole} 复制权限成功`);
      setCheckedKeys(fromRolePermissions.permissions.map(p => p.id));
      dispatch(fetchAllRolePermissionsAsync()); // Refresh data
    } catch (error: any) {
      message.error(error.message || '复制权限失败');
    }
  };

  // Table columns for table mode
  const columns = [
    {
      title: '权限',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text: string, record: Permission) => (
        <Space>
          <Tag color="blue">{text}</Tag>
          {record.conditions && (
            <Tooltip title="有条件限制">
              <span>🔒</span>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: '状态',
      key: 'status',
      render: (record: Permission) => (
        <Checkbox
          checked={checkedKeys.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setCheckedKeys([...checkedKeys, record.id]);
            } else {
              setCheckedKeys(checkedKeys.filter(key => key !== record.id));
            }
          }}
        />
      ),
    },
  ];

  // Get available roles to copy from
  const availableRoles = rolePermissions.map(rp => rp.role).filter(role => role !== selectedRole);

  if (!visible) return null;

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>角色权限配置 - {selectedRole}</span>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={() => {
            dispatch(fetchPermissionsAsync());
            dispatch(fetchAllRolePermissionsAsync());
          }}
        >
          刷新
        </Button>,
        <Button
          key="copy"
          icon={<CopyOutlined />}
          disabled={availableRoles.length === 0}
          onClick={() => {
            if (availableRoles.length === 1) {
              handleCopyFromRole(availableRoles[0]);
            }
            // Could add a modal for multiple roles selection
          }}
        >
          复制权限
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          保存配置
        </Button>,
      ]}
    >
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Space>
            <span>选择角色:</span>
            <Button.Group>
              {rolePermissions.map(rp => (
                <Button
                  key={rp.role}
                  type={selectedRole === rp.role ? 'primary' : 'default'}
                  onClick={() => setSelectedRole(rp.role)}
                >
                  {rp.role} ({rp.totalPermissions})
                </Button>
              ))}
            </Button.Group>
          </Space>
        </Col>
        <Col span={8}>
          <Space>
            <span>视图模式:</span>
            <Switch
              checkedChildren="表格"
              unCheckedChildren="树形"
              checked={mode === 'table'}
              onChange={setMode}
            />
          </Space>
        </Col>
        <Col span={8}>
          <Search
            placeholder="搜索权限"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Alert
            message="权限统计"
            description={
              <Space>
                <span>总权限: {permissions.length}</span>
                <Divider type="vertical" />
                <span>已选择: {checkedKeys.length}</span>
                <Divider type="vertical" />
                <span>选择率: {permissions.length > 0 ? Math.round((checkedKeys.length / permissions.length) * 100) : 0}%</span>
              </Space>
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>

      {mode === 'tree' ? (
        <Tree
          checkable
          onExpand={expandedKeysValue => setExpandedKeys(expandedKeysValue)}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onCheck={handleCheck}
          checkedKeys={checkedKeys}
          treeData={treeData}
          height={400}
          style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px' }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={permissions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个权限`,
          }}
          size="small"
          rowSelection={{
            selectedRowKeys: checkedKeys,
            onChange: setCheckedKeys,
            onSelectAll: (selected) => {
              if (selected) {
                setCheckedKeys(permissions.map(p => p.id));
              } else {
                setCheckedKeys([]);
              }
            },
          }}
        />
      )}
    </Modal>
  );
};

export default RolePermissionConfig;