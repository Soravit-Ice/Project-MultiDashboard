import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message as antdMessage,
  Upload,
  List,
  Tag,
  Space,
  Typography,
  Table,
  Divider
} from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { SpellCheckTextArea, SpellCheckInput } from '../components/SpellCheckInput';
import {
  fetchUserDashboard,
  fetchIntegrationDefinitions,
  fetchUserIntegrations,
  createUserIntegration,
  updateUserIntegration,
  deleteUserIntegration,
  fetchEmailContacts,
  createEmailContact,
  deleteEmailContact,
  fetchEmailGroups,
  createEmailGroup,
  deleteEmailGroup,
  fetchLineContacts,
  createLineContact,
  deleteLineContact,
  fetchLineGroups,
  createLineGroup,
  deleteLineGroup,
  sendUserMessage,
  fetchSentMessages,
  fetchNotifications,
  fetchRecipientUsers,
  fetchRecipientGroups
} from '../api/user';
import AppHeader from '../components/AppHeader';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const DEFAULT_INTEGRATION_TYPE_OPTIONS = [
  { label: 'Discord', value: 'DISCORD' },
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Line', value: 'LINE' },
  { label: 'Email', value: 'EMAIL' }
];

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim()?.toLowerCase());

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [integrationDefinitions, setIntegrationDefinitions] = useState([]);
  const definitionMap = useMemo(
    () =>
      Object.fromEntries(
        integrationDefinitions.map((definition) => [definition.type, definition])
      ),
    [integrationDefinitions]
  );
  const integrationTypeOptions = useMemo(
    () =>
      integrationDefinitions.length
        ? integrationDefinitions.map((definition) => ({
            label: definition.displayName,
            value: definition.type
          }))
        : DEFAULT_INTEGRATION_TYPE_OPTIONS,
    [integrationDefinitions]
  );

  const [integrations, setIntegrations] = useState([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [emailContacts, setEmailContacts] = useState([]);
  const [emailGroups, setEmailGroups] = useState([]);
  const [lineContacts, setLineContacts] = useState([]);
  const [lineGroups, setLineGroups] = useState([]);

  const [recipientUsers, setRecipientUsers] = useState([]);
  const [recipientGroups, setRecipientGroups] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);

  const [attachments, setAttachments] = useState([]);

  const [integrationForm] = Form.useForm();
  const [composeForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [emailGroupForm] = Form.useForm();
  const [lineContactForm] = Form.useForm();
  const [lineGroupForm] = Form.useForm();
  const selectedIntegrationType = Form.useWatch('type', integrationForm);
  const selectedIntegrationDefinition = useMemo(
    () => (selectedIntegrationType ? definitionMap[selectedIntegrationType] : null),
    [definitionMap, selectedIntegrationType]
  );

  useEffect(() => {
    if (!selectedIntegrationDefinition) {
      return;
    }

    const defaults = {};
    selectedIntegrationDefinition.configFields?.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[`config_${field.key}`] =
          field.inputType === 'boolean'
            ? Boolean(field.defaultValue)
            : field.defaultValue;
      }
    });

    if (Object.keys(defaults).length > 0) {
      integrationForm.setFieldsValue(defaults);
    }
  }, [selectedIntegrationDefinition, integrationForm]);

  const connectedIntegrations = useMemo(
    () => integrations.filter((integration) => integration.isConnected),
    [integrations]
  );

  const integrationSelectOptions = connectedIntegrations.map((integration) => ({
    label: integration.name || integration.type,
    value: integration.id
  }));

  const lineIntegrationOptions = connectedIntegrations
    .filter((integration) => integration.type === 'LINE')
    .map((integration) => ({
      label: integration.name || 'LINE Integration',
      value: integration.id
    }));

  const recipientUserOptions = recipientUsers.map((item) => ({
    label: item.name || item.username || item.email,
    value: item.id
  }));

  const recipientGroupOptions = recipientGroups.map((group) => ({
    label: group.name,
    value: group.id
  }));

  const emailContactOptions = emailContacts.map((contact) => ({
    label: contact.name ? `${contact.name} (${contact.email})` : contact.email,
    value: contact.id
  }));

  const emailGroupOptions = emailGroups.map((group) => ({
    label: `${group.name} (${group.members?.length || 0})`,
    value: group.id
  }));

  const lineContactOptions = lineContacts.map((contact) => ({
    label: contact.displayName
      ? `${contact.lineUserId} (${contact.displayName})`
      : contact.lineUserId,
    value: contact.id
  }));

  const lineGroupOptions = lineGroups.map((group) => ({
    label: `${group.name} (${group.members?.length || 0})`,
    value: group.id
  }));

  const loadIntegrationDefinitions = async () => {
    try {
      const data = await fetchIntegrationDefinitions();
      setIntegrationDefinitions(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดข้อมูลการเชื่อมต่อได้');
    }
  };

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const data = await fetchUserDashboard();
      setMetrics(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดข้อมูลภาพรวมได้');
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchIntegrationsData = async () => {
    try {
      setIntegrationsLoading(true);
      const data = await fetchUserIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดการเชื่อมต่อได้');
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const fetchEmailContactsData = async () => {
    try {
      const data = await fetchEmailContacts();
      setEmailContacts(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดรายชื่ออีเมลได้');
    }
  };

  const fetchEmailGroupsData = async () => {
    try {
      const data = await fetchEmailGroups();
      setEmailGroups(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดกลุ่มอีเมลได้');
    }
  };

  const fetchLineContactsData = async () => {
    try {
      const data = await fetchLineContacts();
      setLineContacts(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดผู้ติดต่อ LINE ได้');
    }
  };

  const fetchLineGroupsData = async () => {
    try {
      const data = await fetchLineGroups();
      setLineGroups(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดกลุ่ม LINE ได้');
    }
  };

  const fetchRecipients = async () => {
    try {
      const [usersData, groupsData] = await Promise.all([
        fetchRecipientUsers({ limit: 200 }),
        fetchRecipientGroups()
      ]);
      setRecipientUsers(usersData);
      setRecipientGroups(groupsData);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดรายชื่อผู้รับได้');
    }
  };

  const fetchNotificationsData = async () => {
    try {
      const data = await fetchNotifications({ limit: 50 });
      setNotifications(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดการแจ้งเตือนได้');
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await fetchSentMessages({ limit: 50 });
      setHistory(data);
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถโหลดประวัติการส่งข้อความได้');
    }
  };

  useEffect(() => {
    loadIntegrationDefinitions();
    fetchMetrics();
    fetchIntegrationsData();
    fetchEmailContactsData();
    fetchEmailGroupsData();
    fetchLineContactsData();
    fetchLineGroupsData();
    fetchRecipients();
    fetchNotificationsData();
    fetchHistory();
  }, []);

  const handleCreateIntegration = async (values) => {
    const definition = definitionMap[values.type];

    if (!definition) {
      antdMessage.error('กรุณาเลือกแพลตฟอร์มที่ต้องการเชื่อมต่อ');
      return;
    }

    const hasValue = (val) => !(val === undefined || val === null || val === '');

    const credentials = {};
    definition.credentialFields?.forEach((field) => {
      const fieldName = `credential_${field.key}`;
      const rawValue = values[fieldName];
      if (hasValue(rawValue)) {
        credentials[field.key] = rawValue;
      }
      delete values[fieldName];
    });

    const config = {};
    definition.configFields?.forEach((field) => {
      const fieldName = `config_${field.key}`;
      const rawValue = values[fieldName];
      if (hasValue(rawValue)) {
        config[field.key] = rawValue;
      }
      delete values[fieldName];
    });

    try {
      await createUserIntegration({
        type: values.type,
        name: values.name || null,
        isConnected: values.isConnected ?? true,
        config,
        credentials
      });
      antdMessage.success('เชื่อมต่อสำเร็จ');
      integrationForm.resetFields();
      await loadIntegrationDefinitions();
      fetchIntegrationsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'เชื่อมต่อไม่สำเร็จ');
    }
  };

  const handleToggleIntegration = async (integration) => {
    try {
      await updateUserIntegration(integration.id, {
        isConnected: !integration.isConnected
      });
      fetchIntegrationsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนสถานะการเชื่อมต่อได้');
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    try {
      await deleteUserIntegration(integrationId);
      fetchIntegrationsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถลบการเชื่อมต่อได้');
    }
  };

  const handleCreateContact = async (values) => {
    try {
      await createEmailContact(values);
      antdMessage.success('เพิ่มผู้ติดต่อเรียบร้อย');
      contactForm.resetFields();
      fetchEmailContactsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถเพิ่มผู้ติดต่อได้');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await deleteEmailContact(contactId);
      fetchEmailContactsData();
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถลบผู้ติดต่อได้');
    }
  };

  const handleCreateEmailGroup = async (values) => {
    try {
      await createEmailGroup(values);
      antdMessage.success('สร้างกลุ่มอีเมลเรียบร้อย');
      emailGroupForm.resetFields();
      fetchEmailGroupsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถสร้างกลุ่มได้');
    }
  };

  const handleDeleteEmailGroup = async (groupId) => {
    try {
      await deleteEmailGroup(groupId);
      fetchEmailGroupsData();
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถลบกลุ่มได้');
    }
  };

  const handleCreateLineContact = async (values) => {
    try {
      await createLineContact(values);
      antdMessage.success('เพิ่มผู้ติดต่อ LINE เรียบร้อย');
      lineContactForm.resetFields();
      fetchLineContactsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถเพิ่มผู้ติดต่อ LINE ได้');
    }
  };

  const handleDeleteLineContact = async (contactId) => {
    try {
      await deleteLineContact(contactId);
      fetchLineContactsData();
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถลบผู้ติดต่อ LINE ได้');
    }
  };

  const handleCreateLineGroup = async (values) => {
    try {
      await createLineGroup(values);
      antdMessage.success('สร้างกลุ่ม LINE เรียบร้อย');
      lineGroupForm.resetFields();
      fetchLineGroupsData();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ไม่สามารถสร้างกลุ่ม LINE ได้');
    }
  };

  const handleDeleteLineGroup = async (groupId) => {
    try {
      await deleteLineGroup(groupId);
      fetchLineGroupsData();
    } catch (error) {
      console.error(error);
      antdMessage.error('ไม่สามารถลบกลุ่ม LINE ได้');
    }
  };

  const buildIntegrationFormItem = (field, prefix) => {
    const fieldName = `${prefix}${field.key}`;
    const rules = field.required
      ? [{ required: true, message: `กรุณากรอก ${field.label}` }]
      : [];
    const commonProps = {
      key: fieldName,
      name: fieldName,
      label: field.label,
      rules,
      ...(field.helperText ? { extra: field.helperText } : {}),
      ...(field.defaultValue !== undefined && field.inputType !== 'boolean'
        ? { initialValue: field.defaultValue }
        : {})
    };

    switch (field.inputType) {
      case 'password':
        return (
          <Form.Item {...commonProps}>
            <Input.Password placeholder={field.placeholder} />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item {...commonProps}>
            <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />
          </Form.Item>
        );
      case 'boolean':
        return (
          <Form.Item
            {...commonProps}
            valuePropName="checked"
            initialValue={field.defaultValue !== undefined ? Boolean(field.defaultValue) : false}
          >
            <Switch />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item {...commonProps}>
            <Select
              options={field.options || []}
              placeholder={field.placeholder || 'เลือกค่า'}
              allowClear={!field.required}
            />
          </Form.Item>
        );
      default:
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={field.placeholder} />
          </Form.Item>
        );
    }
  };

  const renderIntegrationDynamicFields = (definition) => (
    <>
      {definition.credentialFields?.length ? (
        <>
          <Divider orientation="left" plain>
            ข้อมูลการเชื่อมต่อ
          </Divider>
          {definition.credentialFields.map((field) =>
            buildIntegrationFormItem(field, 'credential_')
          )}
        </>
      ) : null}
      {definition.configFields?.length ? (
        <>
          <Divider orientation="left" plain>
            การตั้งค่าเพิ่มเติม
          </Divider>
          {definition.configFields.map((field) =>
            buildIntegrationFormItem(field, 'config_')
          )}
        </>
      ) : null}
    </>
  );

  const handleBeforeUpload = (file) => {
    const isAllowed = allowedMimeTypes.includes(file.type);
    if (!isAllowed) {
      antdMessage.error('รองรับเฉพาะไฟล์ PDF, Excel หรือ CSV เท่านั้น');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 <= 10;
    if (!isLt10M) {
      antdMessage.error('ไฟล์ต้องมีขนาดไม่เกิน 10MB');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleAttachmentChange = (info) => {
    setAttachments(info.fileList);
  };

  const handleSendMessage = async (values) => {
    if (!values.integrationIds?.length) {
      antdMessage.error('กรุณาเลือกแพลตฟอร์มที่จะส่ง');
      return;
    }

    const manualEmails = (values.emailAddresses || [])
      .map((email) => email?.trim().toLowerCase())
      .filter(Boolean);

    const invalidEmails = manualEmails.filter((email) => !isValidEmail(email));
    if (invalidEmails.length) {
      antdMessage.error(`อีเมลไม่ถูกต้อง: ${invalidEmails.join(', ')}`);
      return;
    }

    const hasRecipients = Boolean(
      (values.userIds && values.userIds.length) ||
        (values.groupIds && values.groupIds.length) ||
        (values.contactIds && values.contactIds.length) ||
        (values.contactGroupIds && values.contactGroupIds.length) ||
        (values.lineContactIds && values.lineContactIds.length) ||
        (values.lineGroupIds && values.lineGroupIds.length) ||
        (values.lineUserIds && values.lineUserIds.length) ||
        manualEmails.length
    );
    const selectedIntegrations = integrations.filter((integration) =>
      (values.integrationIds || []).includes(integration.id)
    );
    const hasDiscordIntegration = selectedIntegrations.some(
      (integration) => integration.type === 'DISCORD'
    );

    if (!hasRecipients && !hasDiscordIntegration) {
      antdMessage.error('กรุณาเลือกผู้รับหรือเลือก Discord integration สำหรับ broadcast');
      return;
    }

    try {
      await sendUserMessage({
        content: values.content,
        subject: values.subject,
        userIds: values.userIds || [],
        groupIds: values.groupIds || [],
        contactIds: values.contactIds || [],
        contactGroupIds: values.contactGroupIds || [],
        lineContactIds: values.lineContactIds || [],
        lineGroupIds: values.lineGroupIds || [],
        lineUserIds: values.lineUserIds || [],
        emailAddresses: manualEmails,
        integrationIds: values.integrationIds,
        attachments
      });
      antdMessage.success('ส่งข้อความเรียบร้อย');
      composeForm.resetFields();
      setAttachments([]);
      fetchHistory();
      fetchMetrics();
    } catch (error) {
      console.error(error);
      antdMessage.error(error.response?.data?.error || 'ส่งข้อความไม่สำเร็จ');
    }
  };

  const historyColumns = [
    {
      title: 'เวลาที่ส่ง',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDateTime
    },
    {
      title: 'หัวข้อ',
      dataIndex: 'title',
      key: 'title',
      render: (value) => value || '-'
    },
    {
      title: 'แพลตฟอร์ม',
      key: 'integration',
      render: (_, record) => record.integration?.name || record.integration?.type || '-'
    },
    {
      title: 'ผู้รับ',
      key: 'recipient',
      render: (_, record) => {
        if (record.recipientGroup) {
          return (
            <Tag color="blue">
              กลุ่ม: {record.recipientGroup.name}
            </Tag>
          );
        }
        if (record.recipientUser) {
          return record.recipientUser.name || record.recipientUser.username || record.recipientUser.email;
        }
        return '-';
      }
    },
    {
      title: 'อีเมล',
      key: 'email',
      render: (_, record) =>
        record.recipientEmail || record.emailContact?.email || record.recipientUser?.email || '-'
    },
    {
      title: 'LINE',
      key: 'line',
      render: (_, record) =>
        record.lineContact?.lineUserId || record.lineRecipientId || '-'
    },
    {
      title: 'ข้อความ',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: 'ไฟล์แนบ',
      key: 'attachments',
      render: (_, record) => (
        <Space>
          {record.attachments?.map((file) => (
            <a key={file.id} href={file.url} target="_blank" rel="noreferrer">
              {file.originalName}
            </a>
          ))}
          {!record.attachments?.length ? '-' : null}
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader pageTitle="แดชบอร์ดผู้ใช้" />
      <div className="p-6" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => navigate('/spell-check')}
              >
                ตรวจสอบคำผิด
              </Button>
            </Space>
          </Card>
          <Card loading={metricsLoading}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic title="ข้อความทั้งหมด" value={metrics?.totalSent ?? 0} />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic title="24 ชั่วโมงที่ผ่านมา" value={metrics?.sentLast24h ?? 0} />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic title="ไฟล์ที่ส่งทั้งหมด" value={metrics?.attachmentsSent ?? 0} />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="การเชื่อมต่อที่ใช้งาน"
                  value={connectedIntegrations.length}
                />
              </Col>
            </Row>
            {!!metrics?.integrationStats?.length && (
              <>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={5}>จำนวนข้อความต่อแพลตฟอร์ม</Title>
                  <Space wrap>
                    {metrics.integrationStats.map((stat) => (
                      <Tag key={stat.integrationId || 'none'} color="geekblue">
                        {(stat.integration?.name || stat.integration?.type || 'ไม่ระบุ')} : {stat.count}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </>
            )}
          </Card>

          <Row gutter={16}>
            <Col xs={24} lg={14}>
              <Card title="ส่งข้อความหลายแพลตฟอร์ม">
                <Form layout="vertical" form={composeForm} onFinish={handleSendMessage}>
                  <Form.Item
                    name="integrationIds"
                    label="แพลตฟอร์มที่จะส่ง"
                  rules={[{ required: true, message: 'กรุณาเลือกแพลตฟอร์ม' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="เลือกแพลตฟอร์ม"
                    options={integrationSelectOptions}
                  />
                </Form.Item>
                <Form.Item name="subject" label="หัวข้อ (สำหรับอีเมล)">
                  <SpellCheckInput placeholder="ตัวอย่าง: แจ้งเตือนการใช้งาน" spellCheck={true} />
                </Form.Item>
                <Form.Item name="userIds" label="ส่งถึงผู้ใช้ (เดี่ยว)">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกผู้ใช้"
                    options={recipientUserOptions}
                  />
                </Form.Item>
                <Form.Item name="groupIds" label="ส่งถึงกลุ่ม">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกกลุ่ม"
                    options={recipientGroupOptions}
                  />
                </Form.Item>
                <Form.Item name="contactIds" label="ผู้ติดต่ออีเมล">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกผู้ติดต่อ"
                    options={emailContactOptions}
                  />
                </Form.Item>
                <Form.Item name="contactGroupIds" label="กลุ่มอีเมล">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกกลุ่มอีเมล"
                    options={emailGroupOptions}
                  />
                </Form.Item>
                <Form.Item name="emailAddresses" label="อีเมลอื่นๆ (พิมพ์แล้วกด Enter)">
                  <Select mode="tags" placeholder="ตัวอย่าง: user@example.com" />
                </Form.Item>
                <Form.Item name="lineContactIds" label="ผู้ติดต่อ LINE">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกผู้ติดต่อ LINE"
                    options={lineContactOptions}
                  />
                </Form.Item>
                <Form.Item name="lineGroupIds" label="กลุ่ม LINE">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="เลือกกลุ่ม LINE"
                    options={lineGroupOptions}
                  />
                </Form.Item>
                <Form.Item name="lineUserIds" label="LINE User ID (พิมพ์แล้วกด Enter)">
                  <Select mode="tags" placeholder="ตัวอย่าง: Uxxxxxxxx" />
                </Form.Item>
                <Form.Item
                  name="content"
                  label="ข้อความ"
                  rules={[{ required: true, message: 'กรุณากรอกข้อความ' }]}
                >
                    <SpellCheckTextArea rows={4} placeholder="ใส่ข้อความที่ต้องการส่ง" spellCheck={true} />
                  </Form.Item>
                  <Form.Item label="ไฟล์แนบ (PDF / Excel / CSV)">
                    <Dragger
                      multiple
                      beforeUpload={handleBeforeUpload}
                      fileList={attachments}
                      onChange={handleAttachmentChange}
                      accept=".pdf,.xls,.xlsx,.csv"
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด</p>
                      <p className="ant-upload-hint">รองรับไฟล์สูงสุด 10MB ต่อไฟล์</p>
                    </Dragger>
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        ส่งข้อความ
                      </Button>
                      <Button onClick={fetchHistory}>รีเฟรชประวัติ</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="การแจ้งเตือนจากผู้ดูแล">
                <List
                  dataSource={notifications}
                  locale={{ emptyText: 'ยังไม่มีการแจ้งเตือน' }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color="purple">{item.integration?.name || item.integration?.type || 'ระบบ'}</Tag>
                            <Text strong>{item.sender?.name || item.sender?.username || 'ผู้ดูแล'}</Text>
                          </Space>
                        }
                        description={
                          <>
                            <Text>{item.content}</Text>
                            <br />
                            <Text type="secondary">{formatDateTime(item.createdAt)}</Text>
                            {item.attachments?.length ? (
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary">ไฟล์แนบ:</Text>
                                <Space wrap style={{ marginTop: 4 }}>
                                  {item.attachments.map((file) => (
                                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer">
                                      {file.originalName}
                                    </a>
                                  ))}
                                </Space>
                              </div>
                            ) : null}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Button style={{ marginTop: 12 }} onClick={fetchNotificationsData}>
                  โหลดการแจ้งเตือนล่าสุด
                </Button>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card
                title="การเชื่อมต่อแพลตฟอร์ม"
                extra={
                  <Button type="link" onClick={fetchIntegrationsData} loading={integrationsLoading}>
                    รีเฟรช
                  </Button>
                }
              >
                <List
                  dataSource={integrations}
                  locale={{ emptyText: 'ยังไม่มีการเชื่อมต่อ' }}
                  renderItem={(integration) => (
                    <List.Item
                      actions={[
                        <Switch
                          key="toggle"
                          checkedChildren="เชื่อมต่อ"
                          unCheckedChildren="ปิด"
                          checked={integration.isConnected}
                          onChange={() => handleToggleIntegration(integration)}
                        />,
                        <Button
                          key="delete"
                          danger
                          type="link"
                          onClick={() => handleDeleteIntegration(integration.id)}
                        >
                          ลบ
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={integration.name || integration.type}
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text type="secondary">ประเภท: {integration.type}</Text>
                            <Space wrap>
                              {integration.credentialStatus?.map((field) => (
                                <Tag
                                  key={field.key}
                                  color={field.provided ? 'green' : 'red'}
                                >
                                  {field.label}
                                </Tag>
                              ))}
                            </Space>
                            <Text type="secondary">
                              ใช้ไป {integration._count?.messageLogs || 0} ครั้ง
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Divider />
                <Title level={5}>เพิ่มการเชื่อมต่อใหม่</Title>
                <Form layout="vertical" form={integrationForm} onFinish={handleCreateIntegration}>
                  <Form.Item
                    name="type"
                    label="แพลตฟอร์ม"
                    rules={[{ required: true, message: 'กรุณาเลือกแพลตฟอร์ม' }]}
                  >
                    <Select placeholder="เลือกแพลตฟอร์ม" options={integrationTypeOptions} />
                  </Form.Item>
                  {selectedIntegrationDefinition ? (
                    <Space direction="vertical" size={4} style={{ marginBottom: 12 }}>
                      <Text type="secondary">
                        {selectedIntegrationDefinition.description}
                      </Text>
                      {selectedIntegrationDefinition.docsUrl ? (
                        <a
                          href={selectedIntegrationDefinition.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ดูเอกสารการตั้งค่า
                        </a>
                      ) : null}
                    </Space>
                  ) : null}
                  {selectedIntegrationDefinition
                    ? renderIntegrationDynamicFields(selectedIntegrationDefinition)
                    : null}
                  <Form.Item name="name" label="ชื่อที่ใช้เรียก">
                    <Input placeholder="ตัวอย่างเช่น Discord Support" />
                  </Form.Item>
                  <Form.Item
                    name="isConnected"
                    label="สถานะเริ่มต้น"
                    valuePropName="checked"
                    initialValue
                  >
                    <Switch checkedChildren="เชื่อมต่อ" unCheckedChildren="ปิด" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      บันทึกการเชื่อมต่อ
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="ประวัติการส่งข้อความ">
                <Table
                  rowKey="id"
                  columns={historyColumns}
                  dataSource={history}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="ผู้ติดต่ออีเมล">
                <List
                  dataSource={emailContacts}
                  locale={{ emptyText: 'ยังไม่มีผู้ติดต่อ' }}
                  renderItem={(contact) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          ลบ
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={contact.name || contact.email}
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">{contact.email}</Text>
                            {contact.groups?.length ? (
                              <Space wrap>
                                {contact.groups.map((group) => (
                                  <Tag key={group.id}>{group.name}</Tag>
                                ))}
                              </Space>
                            ) : null}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Divider />
                <Title level={5}>เพิ่มผู้ติดต่อ</Title>
                <Form layout="vertical" form={contactForm} onFinish={handleCreateContact}>
                  <Form.Item name="name" label="ชื่อ">
                    <Input placeholder="ชื่อติดต่อ" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="อีเมล"
                    rules={[{ required: true, message: 'กรุณากรอกอีเมล' }]}
                  >
                    <Input type="email" placeholder="user@example.com" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      เพิ่มผู้ติดต่อ
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="กลุ่มอีเมล">
                <List
                  dataSource={emailGroups}
                  locale={{ emptyText: 'ยังไม่มีกลุ่ม' }}
                  renderItem={(group) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeleteEmailGroup(group.id)}
                        >
                          ลบ
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={group.name}
                        description={
                          <Text type="secondary">
                            {group.members?.length || 0} ผู้ติดต่อ
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Divider />
                <Title level={5}>สร้างกลุ่มอีเมล</Title>
                <Form layout="vertical" form={emailGroupForm} onFinish={handleCreateEmailGroup}>
                  <Form.Item
                    name="name"
                    label="ชื่อกลุ่ม"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อกลุ่ม' }]}
                  >
                    <Input placeholder="ตัวอย่าง: ลูกค้า VIP" />
                  </Form.Item>
                  <Form.Item name="contactIds" label="เลือกผู้ติดต่อ">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="เลือกผู้ติดต่อ"
                      options={emailContactOptions}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      สร้างกลุ่ม
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="ผู้ติดต่อ LINE">
                <List
                  dataSource={lineContacts}
                  locale={{ emptyText: 'ยังไม่มีผู้ติดต่อ LINE' }}
                  renderItem={(contact) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeleteLineContact(contact.id)}
                        >
                          ลบ
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={contact.displayName || contact.lineUserId}
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">{contact.lineUserId}</Text>
                            <Text type="secondary">
                              Integration: {contact.integration?.name || contact.integration?.id || '-'}
                            </Text>
                            {contact.groups?.length ? (
                              <Space wrap>
                                {contact.groups.map((group) => (
                                  <Tag key={group.id}>{group.name}</Tag>
                                ))}
                              </Space>
                            ) : null}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Divider />
                <Title level={5}>เพิ่มผู้ติดต่อ LINE</Title>
                <Form layout="vertical" form={lineContactForm} onFinish={handleCreateLineContact}>
                  <Form.Item
                    name="integrationId"
                    label="เลือก LINE Integration"
                    rules={[{ required: true, message: 'กรุณาเลือก LINE integration' }]}
                  >
                    <Select
                      placeholder="เลือก LINE integration"
                      options={lineIntegrationOptions}
                      disabled={!lineIntegrationOptions.length}
                    />
                  </Form.Item>
                  <Form.Item
                    name="lineUserId"
                    label="LINE User ID"
                    rules={[{ required: true, message: 'กรุณากรอก LINE user ID' }]}
                  >
                    <Input placeholder="Uxxxxxxxx" />
                  </Form.Item>
                  <Form.Item name="displayName" label="ชื่อผู้ติดต่อ">
                    <Input placeholder="ชื่อแสดงผล (ถ้ามี)" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block disabled={!lineIntegrationOptions.length}>
                      เพิ่มผู้ติดต่อ LINE
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="กลุ่ม LINE">
                <List
                  dataSource={lineGroups}
                  locale={{ emptyText: 'ยังไม่มีกลุ่ม LINE' }}
                  renderItem={(group) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeleteLineGroup(group.id)}
                        >
                          ลบ
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={group.name}
                        description={
                          <Text type="secondary">
                            {group.members?.length || 0} ผู้ติดต่อ
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Divider />
                <Title level={5}>สร้างกลุ่ม LINE</Title>
                <Form layout="vertical" form={lineGroupForm} onFinish={handleCreateLineGroup}>
                  <Form.Item
                    name="name"
                    label="ชื่อกลุ่ม"
                    rules={[{ required: true, message: 'กรุณากรอกชื่อกลุ่ม' }]}
                  >
                    <Input placeholder="ตัวอย่าง: กลุ่มลูกค้า LINE" />
                  </Form.Item>
                  <Form.Item name="contactIds" label="เลือกผู้ติดต่อ LINE">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="เลือกผู้ติดต่อ LINE"
                      options={lineContactOptions}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      สร้างกลุ่ม LINE
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  );
}
