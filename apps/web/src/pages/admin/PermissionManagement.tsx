import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Checkbox,
  Space,
  Tag,
  message,
  Popconfirm,
  Input,
  Divider,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import {
  fetchPermissionsAsync,
  fetchAllRolePermissionsAsync,
  fetchPermissionStatsAsync,
  assignPermissionsToRoleAsync,
  revokePermissionFromRoleAsync,
  replaceRolePermissionsAsync,
  selectPermissions,
  selectRolePermissions,
  selectPermissionStats,
  selectPermissionLoading,
  selectPermissionError,
} from '../../stores/slices/permissionSlice';

const { TabPane } = Tabs;
const { Option } = Select;

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RolePermission {
  role: string;
  permissions: Permission[];
  totalPermissions: number;
}

interface PermissionStats {
  permissionId: string;
  permissionName: string;
  resource: string;
  action: string;
  rolesAssigned: string[];
  roleCount: number;
}

export const PermissionManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();

  // Redux state
  const permissions = useSelector(selectPermissions);
  const rolePermissions = useSelector(selectRolePermissions);
  const permissionStats = useSelector(selectPermissionStats);
  const loading = useSelector(selectPermissionLoading);
  const error = useSelector(selectPermissionError);

  // Local state
  const [activeTab, setActiveTab] = useState('permissions');
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  // Load data on mount
  useEffect(() => {
    if (hasPermission('permission', 'read')) {
      dispatch(fetchPermissionsAsync());
      dispatch(fetchAllRolePermissionsAsync());
      dispatch(fetchPermissionStatsAsync());
    }
  }, [dispatch, hasPermission]);

  // Filter permissions by search text
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchText.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchText.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchText.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchText.toLowerCase())
  );

  // Get current role permissions
  const currentRolePermissions = rolePermissions.find(rp => rp.role === selectedRole);

  // Handle permission assignment
  const handleAssignPermissions = async () => {
    try {
      await dispatch(assignPermissionsToRoleAsync({
        role: selectedRole,
        permissionIds: selectedPermissions,
      })).unwrap();

      message.success('权限分配成功');
      setAssignModalVisible(false);
      setSelectedPermissions([]);

      // Refresh data
      dispatch(fetchAllRolePermissionsAsync());
    } catch (error: any) {
      message.error(error.message || '权限分配失败');
    }
  };

  // Handle permission revocation
  const handleRevokePermission = async (permissionId: string) => {
    try {
      await dispatch(revokePermissionFromRoleAsync({
        role: selectedRole,
        permissionId,
      })).unwrap();

      message.success('权限撤销成功');

      // Refresh data
      dispatch(fetchAllRolePermissionsAsync());
    } catch (error: any) {
      message.error(error.message || '权限撤销失败');
    }
  };

  // Get available permissions for role (not already assigned)
  const getAvailablePermissions = () => {
    if (!currentRolePermissions) return filteredPermissions;

    const assignedPermissionIds = currentRolePermissions.permissions.map(p => p.id);
    return filteredPermissions.filter(p => !assignedPermissionIds.includes(p.id));
  };

  // Permission table columns
  const permissionColumns = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
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
      title: '使用情况',
      key: 'usage',
      render: (record: Permission) => {
        const stat = permissionStats.find(s => s.permissionId === record.id);
        return stat ? (
          <span>
            <Tag color="orange">{stat.roleCount} 个角色</Tag>
            <span style={{ marginLeft: 8, color: '#666' }}>
              {stat.rolesAssigned.join(', ')}
            </span>
          </span>
        ) : '未使用';
      },
    },
  ];

  // Role permission table columns
  const rolePermissionColumns = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
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
      title: '操作',
      key: 'actions',
      render: (record: Permission) => (
        <Popconfirm
          title="确定要撤销此权限吗？"
          onConfirm={() => handleRevokePermission(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            撤销
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Permission stats columns
  const statsColumns = [
    {
      title: '权限名称',
      dataIndex: 'permissionName',
      key: 'permissionName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
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
      title: '分配的角色数',
      dataIndex: 'roleCount',
      key: 'roleCount',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'red'}>{count}</Tag>
      ),
    },
    {
      title: '已分配的角色',
      dataIndex: 'rolesAssigned',
      key: 'rolesAssigned',
      render: (roles: string[]) => (
        <span>
          {roles.map(role => (
            <Tag key={role} color="blue">{role}</Tag>
          ))}
        </span>
      ),
    },
  ];

  if (!hasPermission('permission', 'read')) {
    return (
      <Alert
        message="访问被拒绝"
        description="您没有权限访问权限管理页面"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总权限数"
              value={permissions.length}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="角色数量"
              value={rolePermissions.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总分配数"
              value={permissionStats.reduce((sum, stat) => sum + stat.roleCount, 0)}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="使用率"
              value={permissions.length > 0 ?
                Math.round((permissionStats.filter(s => s.roleCount > 0).length / permissions.length) * 100) : 0}
              suffix="%"
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="权限列表" key="permissions">
            <div style={{ marginBottom: '16px' }}>
              <Input.Search
                placeholder="搜索权限名称、描述、资源或操作"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '300px' }}
              />
            </div>

            <Table
              columns={permissionColumns}
              dataSource={filteredPermissions}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个权限`,
              }}
            />
          </TabPane>

          <TabPane tab="角色权限" key="rolePermissions">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <span>选择角色:</span>
                <Select
                  value={selectedRole}
                  onChange={setSelectedRole}
                  style={{ width: '120px' }}
                >
                  {rolePermissions.map(rp => (
                    <Option key={rp.role} value={rp.role}>
                      {rp.role} ({rp.totalPermissions})
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAssignModalVisible(true)}
                >
                  分配权限
                </Button>
              </Space>
            </div>

            {currentRolePermissions && (
              <Table
                columns={rolePermissionColumns}
                dataSource={currentRolePermissions.permissions}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个权限`,
                }}
              />
            )}
          </TabPane>

          <TabPane tab="权限统计" key="permissionStats">
            <Table
              columns={statsColumns}
              dataSource={permissionStats}
              rowKey="permissionId"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个权限`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Permission Assignment Modal */}
      <Modal
        title={`为 ${selectedRole} 分配权限`}
        visible={assignModalVisible}
        onOk={handleAssignPermissions}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedPermissions([]);
        }}
        width={800}
        okText="确定分配"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="搜索权限"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <Checkbox.Group
          value={selectedPermissions}
          onChange={setSelectedPermissions}
          style={{ width: '100%', maxHeight: '400px', overflowY: 'auto' }}
        >
          <Row gutter={[16, 8]}>
            {getAvailablePermissions().map(permission => (
              <Col span={24} key={permission.id}>
                <Checkbox value={permission.id}>
                  <Space>
                    <Tag color="blue">{permission.name}</Tag>
                    <span>{permission.description}</span>
                    <Tag>{permission.resource}</Tag>
                    <Tag color="green">{permission.action}</Tag>
                  </Space>
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>

        <Divider />
        <div>
          已选择 {selectedPermissions.length} 个权限
        </div>
      </Modal>
    </div>
  );
};

export default PermissionManagement;