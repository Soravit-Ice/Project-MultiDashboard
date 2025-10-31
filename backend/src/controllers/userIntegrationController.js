import { IntegrationType } from '@prisma/client';
import prisma from '../config/database.js';
import { recordActivity, ActivityType } from '../services/activityService.js';

const INTEGRATION_DEFINITIONS = {
  DISCORD: {
    displayName: 'Discord',
    description: 'ส่งข้อความไปยังช่องหรือ DM ผ่าน Webhook หรือ Bot Token',
    docsUrl: 'https://discord.com/developers/docs/resources/webhook',
    credentialFields: [
      {
        key: 'webhookUrl',
        label: 'Discord Webhook URL',
        required: true,
        inputType: 'password',
        placeholder: 'https://discord.com/api/webhooks/...',
        helperText: 'สร้างได้จาก Channel Settings > Integrations > Webhooks',
        validation: {
          type: 'url'
        }
      },
      {
        key: 'botToken',
        label: 'Bot Token (ตัวเลือก)',
        required: false,
        inputType: 'password',
        helperText: 'ใช้กรณีต้องการให้บอทส่งข้อความหลายช่องหรือ DM'
      }
    ],
    configFields: [
      {
        key: 'deliveryMethod',
        label: 'โหมดการส่ง',
        required: false,
        inputType: 'select',
        options: [
          { label: 'Webhook', value: 'webhook' },
          { label: 'Bot', value: 'bot' }
        ],
        defaultValue: 'webhook'
      }
    ]
  },
  FACEBOOK: {
    displayName: 'Facebook Messenger',
    description: 'ใช้ส่งข้อความผ่านเพจ Facebook (ต้องผ่าน App Review สำหรับ production)',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform',
    credentialFields: [
      {
        key: 'pageAccessToken',
        label: 'Page Access Token',
        required: true,
        inputType: 'password',
        helperText: 'ดึงจาก Meta for Developers > Messenger Settings'
      },
      {
        key: 'appSecret',
        label: 'App Secret',
        required: true,
        inputType: 'password',
        helperText: 'อยู่ใน Basic Settings ของ Facebook App'
      }
    ],
    configFields: [
      {
        key: 'verifyToken',
        label: 'Verify Token',
        required: true,
        inputType: 'text',
        helperText: 'กำหนดเองเพื่อยืนยัน Webhook'
      },
      {
        key: 'pageId',
        label: 'Page ID',
        required: true,
        inputType: 'text',
        helperText: 'ดูได้จาก About บนเพจหรือ Graph API'
      }
    ]
  },
  LINE: {
    displayName: 'LINE Messaging API',
    description: 'รองรับ push message ไปยัง user/group/room ที่เพิ่มบอท',
    docsUrl: 'https://developers.line.biz/en/docs/messaging-api/',
    credentialFields: [
      {
        key: 'channelAccessToken',
        label: 'Channel Access Token',
        required: true,
        inputType: 'password',
        helperText: 'LINE Developers Console > Messaging API'
      },
      {
        key: 'channelSecret',
        label: 'Channel Secret',
        required: true,
        inputType: 'password',
        helperText: 'LINE Developers Console > Messaging API'
      }
    ],
    configFields: [
      {
        key: 'botBasicId',
        label: 'Bot Basic ID',
        required: false,
        inputType: 'text',
        helperText: 'ช่วยในการแสดงผลให้ผู้ใช้ add friend'
      }
    ]
  },
  EMAIL: {
    displayName: 'SMTP/Email',
    description: 'ส่งอีเมลผ่าน SMTP (เช่น Gmail, Outlook, Custom)',
    docsUrl: 'https://nodemailer.com/smtp/',
    credentialFields: [
      {
        key: 'smtpHost',
        label: 'SMTP Host',
        required: true,
        inputType: 'text',
        placeholder: 'smtp.gmail.com'
      },
      {
        key: 'smtpPort',
        label: 'SMTP Port',
        required: true,
        inputType: 'number',
        placeholder: '465 หรือ 587'
      },
      {
        key: 'smtpUser',
        label: 'SMTP Username',
        required: true,
        inputType: 'text'
      },
      {
        key: 'smtpPassword',
        label: 'SMTP Password / App Password',
        required: true,
        inputType: 'password'
      }
    ],
    configFields: [
      {
        key: 'fromName',
        label: 'From Name',
        required: false,
        inputType: 'text',
        placeholder: 'ทีมบริการลูกค้า'
      },
      {
        key: 'fromEmail',
        label: 'From Email',
        required: true,
        inputType: 'text',
        placeholder: 'no-reply@example.com'
      },
      {
        key: 'useTLS',
        label: 'ใช้ TLS',
        required: false,
        inputType: 'boolean',
        defaultValue: true
      },
      {
        key: 'defaultSubject',
        label: 'หัวข้ออีเมลเริ่มต้น',
        required: false,
        inputType: 'text',
        placeholder: 'เช่น แจ้งเตือนจากทีมบริการ'
      }
    ]
  }
};

const integrationTypes = Object.keys(IntegrationType);

const parseObject = (value, fallback = {}) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    return `${value}`.trim();
  }
  return value.trim();
};

const convertFieldValue = (field, rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return undefined;
  }

  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

  switch (field.inputType) {
    case 'number': {
      const numeric = Number(trimmed);
      if (Number.isNaN(numeric)) {
        throw new Error(`${field.label} ต้องเป็นตัวเลข`);
      }
      return numeric;
    }
    case 'boolean':
      if (typeof trimmed === 'boolean') {
        return trimmed;
      }
      if (typeof trimmed === 'string') {
        return ['true', '1', 'yes', 'on'].includes(trimmed.toLowerCase());
      }
      return Boolean(trimmed);
    default:
      return sanitizeString(trimmed);
  }
};

const extractFields = (fields, source, { allowPartial = false } = {}) => {
  if (!fields?.length) {
    return {};
  }

  const output = {};
  const sourceObject = parseObject(source, {});

  fields.forEach((field) => {
    const rawValue = sourceObject[field.key];
    const converted = convertFieldValue(field, rawValue);

    if (converted === undefined) {
      if (!allowPartial && field.required) {
        throw new Error(`กรุณาระบุ ${field.label}`);
      }
      return;
    }

    if (field.validation?.type === 'url') {
      try {
        const url = new URL(converted);
        output[field.key] = url.toString();
        return;
      } catch (error) {
        throw new Error(`${field.label} ต้องเป็น URL ที่ถูกต้อง`);
      }
    }

    output[field.key] = converted;
  });

  return output;
};

const hasRequiredFields = (fields, values) =>
  fields.every((field) => !field.required || Boolean(values?.[field.key]));

const ensureRequirements = (type, config, credentials) => {
  const definition = INTEGRATION_DEFINITIONS[type];
  if (!definition) {
    return;
  }

  if (!hasRequiredFields(definition.credentialFields, credentials)) {
    throw new Error('กรุณากรอกข้อมูลการเชื่อมต่อให้ครบถ้วนก่อนเปิดใช้งาน');
  }

  if (!hasRequiredFields(definition.configFields, config)) {
    throw new Error('กรุณากรอกข้อมูลการตั้งค่าให้ครบถ้วนก่อนเปิดใช้งาน');
  }
};

const sanitizeIntegrationRecord = (integration) => {
  const definition = INTEGRATION_DEFINITIONS[integration.type] || {};
  const safeConfig = {};

  definition.configFields?.forEach((field) => {
    if (integration.config && integration.config[field.key] !== undefined) {
      safeConfig[field.key] = integration.config[field.key];
    }
  });

  return {
    id: integration.id,
    type: integration.type,
    name: integration.name,
    isConnected: integration.isConnected,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    config: safeConfig,
    hasCredentials: Boolean(
      integration.credentials && Object.keys(integration.credentials).length > 0
    ),
    credentialStatus: (definition.credentialFields || []).map((field) => ({
      key: field.key,
      label: field.label,
      provided: Boolean(integration.credentials?.[field.key])
    })),
    _count: integration._count
  };
};

export async function getIntegrationDefinitions(req, res) {
  try {
    const definitions = Object.entries(INTEGRATION_DEFINITIONS).map(
      ([type, definition]) => ({
        type,
        displayName: definition.displayName,
        description: definition.description,
        docsUrl: definition.docsUrl,
        credentialFields: definition.credentialFields,
        configFields: definition.configFields
      })
    );

    res.json({ definitions });
  } catch (error) {
    console.error('getIntegrationDefinitions error:', error);
    res.status(500).json({ error: 'Failed to load integration definitions.' });
  }
}

export async function listIntegrations(req, res) {
  try {
    const integrations = await prisma.userIntegration.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messageLogs: true }
        }
      }
    });

    res.json({
      integrations: integrations.map(sanitizeIntegrationRecord)
    });
  } catch (error) {
    console.error('listIntegrations error:', error);
    res.status(500).json({ error: 'Failed to load integrations.' });
  }
}

export async function createIntegration(req, res) {
  try {
    const { type, name, config, credentials, isConnected = true } = req.body;

    if (!type || !integrationTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid integration type.' });
    }

    const definition = INTEGRATION_DEFINITIONS[type];
    if (!definition) {
      return res.status(400).json({ error: 'Unsupported integration type.' });
    }

    const normalizedConfig = extractFields(definition.configFields, config);
    const normalizedCredentials = extractFields(definition.credentialFields, credentials);

    if (isConnected) {
      ensureRequirements(type, normalizedConfig, normalizedCredentials);
    }

    const integration = await prisma.userIntegration.create({
      data: {
        userId: req.user.id,
        type,
        name: sanitizeString(name) || null,
        isConnected: Boolean(isConnected),
        config: normalizedConfig,
        credentials: normalizedCredentials
      },
      include: {
        _count: {
          select: { messageLogs: true }
        }
      }
    });

    await recordActivity({
      type: ActivityType.MESSAGE_SEND,
      actorId: req.user.id,
      entityId: integration.id,
      entityType: 'USER_INTEGRATION',
      metadata: { action: 'CREATE', integrationType: type }
    });

    res.status(201).json({ integration: sanitizeIntegrationRecord(integration) });
  } catch (error) {
    console.error('createIntegration error:', error);
    res.status(400).json({ error: error.message || 'Failed to create integration.' });
  }
}

export async function updateIntegration(req, res) {
  try {
    const { integrationId } = req.params;
    const { name, config, credentials, isConnected } = req.body;

    const existing = await prisma.userIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Integration not found.' });
    }

    const definition = INTEGRATION_DEFINITIONS[existing.type];
    if (!definition) {
      return res.status(400).json({ error: 'Unsupported integration type.' });
    }

    const currentConfig = existing.config || {};
    const currentCredentials = existing.credentials || {};

    let nextConfig = currentConfig;
    let nextCredentials = currentCredentials;

    if (config !== undefined) {
      const updates = extractFields(definition.configFields, config, { allowPartial: true });
      nextConfig = { ...currentConfig, ...updates };
    }

    if (credentials !== undefined) {
      const updates = extractFields(definition.credentialFields, credentials, {
        allowPartial: true
      });
      nextCredentials = { ...currentCredentials, ...updates };
    }

    const nextName = name !== undefined ? sanitizeString(name) || null : existing.name;
    const nextIsConnected =
      typeof isConnected === 'boolean' ? isConnected : existing.isConnected;

    if (nextIsConnected) {
      ensureRequirements(existing.type, nextConfig, nextCredentials);
    }

    const updated = await prisma.userIntegration.update({
      where: { id: integrationId },
      data: {
        name: nextName,
        isConnected: nextIsConnected,
        config: nextConfig,
        credentials: nextCredentials
      },
      include: {
        _count: {
          select: { messageLogs: true }
        }
      }
    });

    await recordActivity({
      type: ActivityType.MESSAGE_SEND,
      actorId: req.user.id,
      entityId: integrationId,
      entityType: 'USER_INTEGRATION',
      metadata: { action: 'UPDATE' }
    });

    res.json({ integration: sanitizeIntegrationRecord(updated) });
  } catch (error) {
    console.error('updateIntegration error:', error);
    res.status(400).json({ error: error.message || 'Failed to update integration.' });
  }
}

export async function deleteIntegration(req, res) {
  try {
    const { integrationId } = req.params;

    const integration = await prisma.userIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.userId !== req.user.id) {
      return res.status(404).json({ error: 'Integration not found.' });
    }

    await prisma.userIntegration.delete({
      where: { id: integrationId }
    });

    res.json({ message: 'Integration removed.' });
  } catch (error) {
    console.error('deleteIntegration error:', error);
    res.status(500).json({ error: 'Failed to delete integration.' });
  }
}
