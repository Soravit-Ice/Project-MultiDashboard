import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Form,
  Input,
  Space,
  message as antdMessage,
  Switch,
  Tag,
  DatePicker,
  Select,
  Popconfirm,
  List,
  Typography,
  Modal
} from 'antd';
import {
  executeSql,
  fetchSqlHistory,
  fetchAdminPreferences,
  updateAdminPreference,
  fetchDashboardMetrics,
  fetchUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser as deleteUserApi,
  fetchMessageLogs,
  sendManualMessage,
  fetchGroups,
  createGroup,
  addGroupMembers,
  removeGroupMember,
  deleteGroup as deleteGroupApi,
  fetchSchedules,
  createSchedule,
  rescheduleMessage,
  cancelSchedule,
  runSchedulerNow,
  fetchAdminCodes,
  createAdminCode,
  deactivateAdminCode,
  deleteAdminCode,
  exportMessageLogs,
  exportQueryHistory
} from '../api/admin';
import { fetchLineContacts as fetchLineContactsAPI } from '../api/user';
import AppHeader from '../components/AppHeader';
import { SpellCheckTextArea } from '../components/SpellCheckInput';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

const dateCellRenderer = (value) => (value ? new Date(value).toLocaleString() : '-');

function DashboardTab({ metrics, loading, onReload }) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Overview" extra={<Button onClick={onReload} loading={loading}>Refresh</Button>}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Users" value={metrics?.totals?.users ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Admins" value={metrics?.totals?.admins ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Outbound (24h)" value={metrics?.messaging?.outboundLast24h ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Inbound (24h)" value={metrics?.messaging?.inboundLast24h ?? 0} />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Scheduled Pending" value={metrics?.messaging?.scheduledPending ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Scheduled Sent (7d)" value={metrics?.messaging?.scheduledSentLast7d ?? 0} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="Active Users (7d)" value={metrics?.activeUsers ?? 0} />
          </Col>
        </Row>
      </Card>

      <Card title="Recent Messages">
        <List
          dataSource={metrics?.recentMessages ?? []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={item.direction === 'OUTBOUND' ? 'blue' : 'green'}>
                      {item.direction}
                    </Tag>
                    <Text strong>{dateCellRenderer(item.createdAt)}</Text>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>
                      {item.content}
                    </Paragraph>
                    <Text type="secondary">
                      From: {item.sender?.name || item.sender?.username || 'System'} →{' '}
                      {item.recipientUser?.name || item.recipientUser?.username || 'Broadcast'}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}

function SqlConsoleTab({
  sqlQuery,
  onChangeQuery,
  onExecute,
  executing,
  result,
  history,
  showHistory,
  onToggleHistory,
  loadingHistory
}) {
  const isTabular =
    Array.isArray(result) &&
    result.length > 0 &&
    typeof result[0] === 'object' &&
    result[0] !== null;

  const tableColumns = isTabular
    ? Object.keys(
        result.reduce((acc, row) => {
          Object.keys(row || {}).forEach((key) => {
            acc[key] = true;
          });
          return acc;
        }, {})
      ).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        render: (value) =>
          typeof value === 'object' && value !== null ? JSON.stringify(value) : value ?? ''
      }))
    : [];

  const columns = [
    { title: 'Executed', dataIndex: 'executedAt', key: 'executedAt', render: dateCellRenderer },
    { title: 'Success', dataIndex: 'success', key: 'success', render: (value) => (value ? <Tag color="green">Success</Tag> : <Tag color="red">Error</Tag>) },
    { title: 'Rows', dataIndex: 'resultRowCount', key: 'resultRowCount' },
    { title: 'Time (ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs' },
    { title: 'Query', dataIndex: 'query', key: 'query', ellipsis: true }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="SQL Console"
        extra={
          <Space>
            <span>Show History</span>
            <Switch checked={showHistory} onChange={onToggleHistory} />
          </Space>
        }
      >
        <Form layout="vertical" onFinish={onExecute}>
          <Form.Item label="SQL Query" required>
            <SpellCheckTextArea
              rows={6}
              value={sqlQuery}
              onChange={(event) => onChangeQuery(event.target.value)}
              placeholder="SELECT * FROM users LIMIT 10"
              spellCheck={true}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={executing}>
              Execute
            </Button>
          </Form.Item>
        </Form>
        {result && (
          <Card type="inner" title="Result" style={{ marginTop: 16 }}>
            {isTabular ? (
              <Table
                size="small"
                pagination={{ pageSize: 10 }}
                dataSource={result.map((row, index) => ({ key: index, ...row }))}
                columns={tableColumns}
                scroll={{ x: 'max-content' }}
              />
            ) : null}
            <pre style={{ maxHeight: 320, overflow: 'auto', marginTop: 16 }}>
{JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Card>

      {showHistory && (
        <Card title="History" loading={loadingHistory}>
          <Table
            rowKey="id"
            dataSource={history}
            columns={columns}
            pagination={false}
          />
        </Card>
      )}
    </Space>
  );
}

function UsersTab({
  users,
  onRefresh,
  loading,
  onCreateUser,
  onMakeAdmin,
  onMakeUser,
  onDelete,
  lineContacts = [],
  onUpdateLine
}) {
  const [form] = Form.useForm();
  const [lineForm] = Form.useForm();
  const [lineModal, setLineModal] = useState({ open: false, user: null });

  const lineContactOptions = lineContacts.map((contact) => ({
    label: contact.displayName ? `${contact.lineUserId} (${contact.displayName})` : contact.lineUserId,
    value: contact.id,
    lineUserId: contact.lineUserId
  }));

  const handleSubmit = async (values) => {
    await onCreateUser(values);
    form.resetFields();
  };

  const openLineModal = (user) => {
    setLineModal({ open: true, user });
    lineForm.setFieldsValue({ lineUserId: user.lineUserId || '' });
  };

  const handleLineSubmit = async () => {
    try {
      const values = await lineForm.validateFields();
      let selectedLineUserId = values.lineUserId?.trim() || null;
      if (values.selectedLineContactId) {
        const contact = lineContacts.find((item) => item.id === values.selectedLineContactId);
        if (contact?.lineUserId) {
          selectedLineUserId = contact.lineUserId;
        }
      }
      await onUpdateLine(lineModal.user.id, selectedLineUserId);
      setLineModal({ open: false, user: null });
      lineForm.resetFields();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'LINE User ID', dataIndex: 'lineUserId', key: 'lineUserId', render: (value) => value || '-' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'blue' : 'default'}>{role}</Tag>
      )
    },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: dateCellRenderer },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onMakeAdmin(record.id)} disabled={record.role === 'ADMIN'}>
            Make Admin
          </Button>
          <Button size="small" onClick={() => onMakeUser(record.id)} disabled={record.role === 'USER'}>
            Make User
          </Button>
          <Button size="small" onClick={() => openLineModal(record)}>
            Set LINE ID
          </Button>
          <Popconfirm
            title="Delete user?"
            okText="Delete"
            okType="danger"
            onConfirm={() => onDelete(record.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Create User">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Email is required' }]}
              >
                <Input placeholder="user@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input placeholder="username" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password placeholder="Secure password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Name">
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="lineUserId" label="LINE User ID">
                <Input placeholder="Uxxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={onRefresh} loading={loading}>
              Refresh
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Users">
        <Table
          rowKey="id"
          dataSource={users}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      <Modal
        title={`Set LINE ID for ${lineModal.user?.name || lineModal.user?.username || ''}`}
        open={lineModal.open}
        onCancel={() => {
          setLineModal({ open: false, user: null });
          lineForm.resetFields();
        }}
        onOk={handleLineSubmit}
        okText="Save"
      >
        <Form form={lineForm} layout="vertical">
          <Form.Item name="selectedLineContactId" label="เลือกจาก Followers">
            <Select
              showSearch
              allowClear
              placeholder="เลือกผู้ติดต่อ LINE"
              options={lineContactOptions}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                if (!value) {
                  return;
                }
                const contact = lineContacts.find((item) => item.id === value);
                if (contact?.lineUserId) {
                  lineForm.setFieldsValue({ lineUserId: contact.lineUserId });
                }
              }}
            />
          </Form.Item>
          <Form.Item name="lineUserId" label="LINE User ID">
            <Input placeholder="Uxxxxxxxx" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function MessagingTab({
  users,
  groups,
  logs,
  loadingLogs,
  onReloadLogs,
  onSendMessage
}) {
  const [form] = Form.useForm();

  const columns = [
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: dateCellRenderer },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      render: (value) => (
        <Tag color={value === 'OUTBOUND' ? 'blue' : 'green'}>{value}</Tag>
      )
    },
    { title: 'Channel', dataIndex: 'channel', key: 'channel' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Recipient', dataIndex: ['recipientUser', 'username'], key: 'recipientUser', render: (_, record) => record.recipientUser?.username || record.recipientUserId || '-' },
    { title: 'Group', dataIndex: ['recipientGroup', 'name'], key: 'group', render: (_, record) => record.recipientGroup?.name || '-' },
    { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true }
  ];

  const handleSubmit = async (values) => {
    const payload = {
      userIds: values.userIds || [],
      groupIds: values.groupIds || [],
      content: values.content
    };
    await onSendMessage(payload);
    form.resetFields();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Send Message">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="userIds" label="Users">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select users"
                  options={users.map((user) => ({
                    label: user.username || user.email,
                    value: user.id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="groupIds" label="Groups">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select groups"
                  options={groups.map((group) => ({
                    label: group.name,
                    value: group.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="Message"
            rules={[{ required: true, message: 'Message content is required.' }]}
          >
            <SpellCheckTextArea rows={4} placeholder="Enter message to send" spellCheck={true} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Send
              </Button>
              <Button onClick={onReloadLogs} loading={loadingLogs}>
                Refresh Logs
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Message Logs">
        <Table
          rowKey="id"
          dataSource={logs}
          columns={columns}
          loading={loadingLogs}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
}

function GroupsTab({ groups, users, onCreateGroup, onAddMembers, onRemoveMember, onDeleteGroup }) {
  const [form] = Form.useForm();

  const handleCreate = async (values) => {
    await onCreateGroup({
      name: values.name,
      description: values.description || null,
      memberIds: values.memberIds || []
    });
    form.resetFields();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members = []) => (
        <Space wrap>
          {members.map((member) => (
            <Tag key={member.id}>{member.user?.username || member.user?.email}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space direction="vertical">
          <Select
            mode="multiple"
            allowClear
            placeholder="Add members"
            style={{ minWidth: 200 }}
            options={users.map((user) => ({
              label: user.username || user.email,
              value: user.id
            }))}
            onChange={(values) => {
              if (values.length) {
                onAddMembers({
                  groupId: record.id,
                  memberIds: values
                });
              }
            }}
          />
          <Space wrap>
            {record.members?.map((member) => (
              <Popconfirm
                key={member.userId}
                title="Remove member?"
                onConfirm={() => onRemoveMember({ groupId: record.id, userId: member.userId })}
              >
                <Tag color="red" style={{ cursor: 'pointer' }}>
                  Remove {member.user?.username || member.user?.email}
                </Tag>
              </Popconfirm>
            ))}
          </Space>
          <Popconfirm
            title="Delete group?"
            okText="Delete"
            okType="danger"
            onConfirm={() => onDeleteGroup(record.id)}
          >
            <Button danger size="small">
              Delete Group
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Create Group">
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Group Name"
                rules={[{ required: true, message: 'Group name is required.' }]}
              >
                <Input placeholder="Customer Support" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="description" label="Description">
                <Input placeholder="Optional description" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="memberIds" label="Initial Members">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select members"
              options={users.map((user) => ({
                label: user.username || user.email,
                value: user.id
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Group
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Groups">
        <Table
          rowKey="id"
          dataSource={groups}
          columns={columns}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );
}

function SchedulesTab({ schedules, users, groups, onCreate, onReschedule, onCancel, onRunNow, loading }) {
  const [form] = Form.useForm();

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (value) => value || '-' },
    { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: 'Schedule At', dataIndex: 'scheduleAt', key: 'scheduleAt', render: dateCellRenderer },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients = []) => (
        <Space wrap>
          {recipients.map((recipient) => (
            <Tag key={recipient.id}>
              {recipient.recipientType === 'USER' ? `User: ${recipient.userId}` : `Group: ${recipient.groupId}`}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <DatePicker
            showTime
            onChange={(value) => {
              if (value) {
                onReschedule({ scheduleId: record.id, scheduleAt: value.toISOString() });
              }
            }}
          />
          <Button onClick={() => onCancel(record.id)} disabled={record.status === 'CANCELLED'} danger>
            Cancel
          </Button>
        </Space>
      )
    }
  ];

  const handleSubmit = async (values) => {
    await onCreate({
      title: values.title || null,
      content: values.content,
      scheduleAt: values.scheduleAt.toISOString(),
      userIds: values.userIds || [],
      groupIds: values.groupIds || []
    });
    form.resetFields();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="Create Scheduled Message"
        extra={<Button onClick={onRunNow}>Run Scheduler Now</Button>}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="title" label="Title">
            <Input placeholder="Optional title" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Message content is required.' }]}
          >
            <SpellCheckTextArea rows={4} placeholder="Message to send" spellCheck={true} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="scheduleAt"
                label="Send At"
                rules={[{ required: true, message: 'Schedule time is required.' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="userIds" label="Users">
                <Select
                  mode="multiple"
                  allowClear
                  options={users.map((user) => ({
                    label: user.username || user.email,
                    value: user.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="groupIds" label="Groups">
            <Select
              mode="multiple"
              allowClear
              options={groups.map((group) => ({
                label: group.name,
                value: group.id
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Schedule
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Scheduled Messages">
        <Table
          rowKey="id"
          dataSource={schedules}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );
}

function CodesTab({ codes, onCreate, onDeactivate, onDelete }) {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    await onCreate({
      code: values.code,
      description: values.description || null,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      maxUses: values.maxUses ? Number(values.maxUses) : null
    });
    form.resetFields();
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
    { title: 'Expires At', dataIndex: 'expiresAt', key: 'expiresAt', render: dateCellRenderer },
    { title: 'Max Uses', dataIndex: 'maxUses', key: 'maxUses', render: (value) => value ?? '-' },
    { title: 'Usage', dataIndex: 'usageCount', key: 'usageCount' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => (value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => onDeactivate(record.id)}
            disabled={!record.isActive}
          >
            Deactivate
          </Button>
          <Popconfirm
            title="Delete code?"
            okText="Delete"
            okType="danger"
            onConfirm={() => onDelete(record.id)}
          >
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Create Code">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Code is required.' }]}
              >
                <Input placeholder="PROMO-2025" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="maxUses" label="Max Uses">
                <Input type="number" placeholder="Unlimited if empty" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="expiresAt" label="Expires At">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="description" label="Description">
                <Input placeholder="Optional description" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Codes">
        <Table
          rowKey="id"
          dataSource={codes}
          columns={columns}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );
}

function ExportTab() {
  return (
    <Card title="Export">
      <Space direction="vertical">
        <Space>
          <Button onClick={() => exportQueryHistory('excel')}>Export Query History (Excel)</Button>
          <Button onClick={() => exportQueryHistory('pdf')}>Export Query History (PDF)</Button>
        </Space>
        <Space>
          <Button onClick={() => exportMessageLogs('excel')}>Export Message Logs (Excel)</Button>
          <Button onClick={() => exportMessageLogs('pdf')}>Export Message Logs (PDF)</Button>
        </Space>
      </Space>
    </Card>
  );
}

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM "User" LIMIT 10');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlExecuting, setSqlExecuting] = useState(false);
  const [sqlHistory, setSqlHistory] = useState([]);
  const [sqlHistoryLoading, setSqlHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [lineContacts, setLineContacts] = useState([]);

  const [messageLogs, setMessageLogs] = useState([]);
  const [messageLogsLoading, setMessageLogsLoading] = useState(false);

  const [groups, setGroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const [codes, setCodes] = useState([]);

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load metrics.');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadLineContacts = useCallback(async () => {
    try {
      const data = await fetchLineContactsAPI();
      setLineContacts(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadSqlHistory = useCallback(async () => {
    if (!showHistory) {
      return;
    }
    try {
      setSqlHistoryLoading(true);
      const data = await fetchSqlHistory({ limit: 100 });
      setSqlHistory(data.items ?? []);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load history.');
    } finally {
      setSqlHistoryLoading(false);
    }
  }, [showHistory]);

  const loadPreferences = useCallback(async () => {
    try {
      const preferences = await fetchAdminPreferences();
      if (preferences.showQueryHistory !== undefined) {
        setShowHistory(Boolean(preferences.showQueryHistory));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadMessageLogs = useCallback(async () => {
    try {
      setMessageLogsLoading(true);
      const logs = await fetchMessageLogs({ limit: 100 });
      setMessageLogs(logs);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load message logs.');
    } finally {
      setMessageLogsLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load groups.');
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true);
      const data = await fetchSchedules({ limit: 50 });
      setSchedules(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load schedules.');
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  const loadCodes = useCallback(async () => {
    try {
      const data = await fetchAdminCodes();
      setCodes(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to load codes.');
    }
  }, []);

  const handleExecuteSql = async () => {
    try {
      setSqlExecuting(true);
      const response = await executeSql({ query: sqlQuery });
      setSqlResult(response.result);
      antdMessage.success('Query executed successfully.');
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to execute query.');
    } finally {
      setSqlExecuting(false);
      loadSqlHistory();
    }
  };

  const handleToggleHistory = async (checked) => {
    setShowHistory(checked);
    try {
      await updateAdminPreference({ key: 'showQueryHistory', value: checked });
      if (checked) {
        loadSqlHistory();
      }
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to update preference.');
    }
  };

  const handleCreateUser = async (payload) => {
    try {
      await createUser(payload);
      antdMessage.success('User created.');
      loadUsers();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to create user.');
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      await updateUserRole({ userId, role: 'ADMIN' });
      antdMessage.success('Role updated.');
      loadUsers();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to update role.');
    }
  };

  const handleMakeUser = async (userId) => {
    try {
      await updateUserRole({ userId, role: 'USER' });
      antdMessage.success('Role updated.');
      loadUsers();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUserApi(userId);
      antdMessage.success('User deleted.');
      loadUsers();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to delete user.');
    }
  };

  const handleUpdateLineId = async (userId, lineUserId) => {
    try {
      await updateUser({ userId, lineUserId });
      antdMessage.success('LINE ID updated.');
      loadUsers();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to update LINE ID.');
    }
  };

  const onSendMessage = async (payload) => {
    try {
      await sendManualMessage(payload);
      antdMessage.success('Message sent.');
      loadMessageLogs();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to send message.');
    }
  };

  const handleCreateGroup = async (payload) => {
    try {
      await createGroup(payload);
      antdMessage.success('Group created.');
      loadGroups();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to create group.');
    }
  };

  const handleAddMembers = async ({ groupId, memberIds }) => {
    try {
      await addGroupMembers({ groupId, memberIds });
      antdMessage.success('Members added.');
      loadGroups();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to add members.');
    }
  };

  const handleRemoveMember = async ({ groupId, userId }) => {
    try {
      await removeGroupMember({ groupId, userId });
      antdMessage.success('Member removed.');
      loadGroups();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to remove member.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroupApi(groupId);
      antdMessage.success('Group deleted.');
      loadGroups();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to delete group.');
    }
  };

  const handleCreateSchedule = async (payload) => {
    try {
      await createSchedule(payload);
      antdMessage.success('Scheduled message created.');
      loadSchedules();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to create scheduled message.');
    }
  };

  const handleReschedule = async ({ scheduleId, scheduleAt }) => {
    try {
      await rescheduleMessage({ scheduleId, scheduleAt });
      antdMessage.success('Message rescheduled.');
      loadSchedules();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to reschedule.');
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    try {
      await cancelSchedule(scheduleId);
      antdMessage.success('Message cancelled.');
      loadSchedules();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to cancel.');
    }
  };

  const handleRunSchedulerNow = async () => {
    try {
      await runSchedulerNow();
      antdMessage.success('Scheduler executed.');
      loadSchedules();
      loadMessageLogs();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to run scheduler.');
    }
  };

  const handleCreateCode = async (payload) => {
    try {
      await createAdminCode(payload);
      antdMessage.success('Code created.');
      loadCodes();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'Failed to create code.');
    }
  };

  const handleDeactivateCode = async (codeId) => {
    try {
      await deactivateAdminCode(codeId);
      antdMessage.success('Code deactivated.');
      loadCodes();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to deactivate code.');
    }
  };

  const handleDeleteCode = async (codeId) => {
    try {
      await deleteAdminCode(codeId);
      antdMessage.success('Code deleted.');
      loadCodes();
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to delete code.');
    }
  };

  const ensureDataForTab = useCallback((key) => {
    switch (key) {
      case 'dashboard':
        loadMetrics();
        break;
      case 'sql':
        loadSqlHistory();
        break;
      case 'users':
        loadUsers();
        loadLineContacts();
        break;
      case 'messaging':
        loadUsers();
        loadGroups();
        loadMessageLogs();
        loadLineContacts();
        break;
      case 'groups':
        loadUsers();
        loadGroups();
        break;
      case 'schedules':
        loadUsers();
        loadGroups();
        loadSchedules();
        break;
      case 'codes':
        loadCodes();
        break;
      default:
        break;
    }
  }, [loadMetrics, loadSqlHistory, loadUsers, loadGroups, loadMessageLogs, loadSchedules, loadCodes]);

  useEffect(() => {
    loadPreferences();
    ensureDataForTab(activeTab);
  }, [activeTab, ensureDataForTab, loadPreferences]);

  useEffect(() => {
    loadLineContacts();
  }, [loadLineContacts]);

  const tabs = useMemo(() => ([
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: (
        <DashboardTab
          metrics={metrics}
          loading={metricsLoading}
          onReload={loadMetrics}
        />
      )
    },
    {
      key: 'sql',
      label: 'SQL Console',
      children: (
        <SqlConsoleTab
          sqlQuery={sqlQuery}
          onChangeQuery={setSqlQuery}
          onExecute={handleExecuteSql}
          executing={sqlExecuting}
          result={sqlResult}
          history={sqlHistory}
          showHistory={showHistory}
          loadingHistory={sqlHistoryLoading}
          onToggleHistory={handleToggleHistory}
        />
      )
    },
    {
      key: 'users',
      label: 'Users',
      children: (
        <UsersTab
          users={users}
          loading={usersLoading}
          onRefresh={loadUsers}
          onCreateUser={handleCreateUser}
          onMakeAdmin={handleMakeAdmin}
          onMakeUser={handleMakeUser}
          onDelete={handleDeleteUser}
          lineContacts={lineContacts}
          onUpdateLine={handleUpdateLineId}
        />
      )
    },
    {
      key: 'messaging',
      label: 'Messaging',
      children: (
        <MessagingTab
          users={users}
          groups={groups}
          logs={messageLogs}
          loadingLogs={messageLogsLoading}
          onReloadLogs={loadMessageLogs}
          onSendMessage={onSendMessage}
        />
      )
    },
    {
      key: 'groups',
      label: 'Groups',
      children: (
        <GroupsTab
          groups={groups}
          users={users}
          onCreateGroup={handleCreateGroup}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onDeleteGroup={handleDeleteGroup}
        />
      )
    },
    {
      key: 'schedules',
      label: 'Schedules',
      children: (
        <SchedulesTab
          schedules={schedules}
          users={users}
          groups={groups}
          onCreate={handleCreateSchedule}
          onReschedule={handleReschedule}
          onCancel={handleCancelSchedule}
          onRunNow={handleRunSchedulerNow}
          loading={schedulesLoading}
        />
      )
    },
    {
      key: 'codes',
      label: 'Codes',
      children: (
        <CodesTab
          codes={codes}
          onCreate={handleCreateCode}
          onDeactivate={handleDeactivateCode}
          onDelete={handleDeleteCode}
        />
      )
    },
    {
      key: 'exports',
      label: 'Export',
      children: <ExportTab />
    }
  ]), [
    metrics,
    metricsLoading,
    loadMetrics,
    sqlQuery,
    sqlExecuting,
    sqlResult,
    sqlHistory,
    showHistory,
    sqlHistoryLoading,
    users,
    usersLoading,
    groups,
    messageLogs,
    messageLogsLoading,
    schedules,
    schedulesLoading,
    codes
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader pageTitle="Admin Control Center" />
      <div className="p-6">
        <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Manage users, messaging, SQL queries, schedules, and more from a single dashboard.
            </Paragraph>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
              }}
              items={tabs}
            />
          </Space>
        </Card>
      </div>
    </div>
  );
}
