import path from 'path';
import {
  IntegrationType,
  MessageChannel,
  MessageDirection,
  MessageSource,
  MessageStatus,
  ScheduledMessageStatus,
  ScheduledRecipientType
} from '@prisma/client';
import prisma from '../config/database.js';
import { recordActivity, ActivityType } from './activityService.js';
import { uploadsDir } from '../config/upload.js';
import { getEmailTransporter } from '../providers/emailProvider.js';
import { sendLinePush } from '../providers/lineProvider.js';
import { sendDiscordMessage } from '../providers/discordProvider.js';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const EMAIL_REQUIRED_CREDENTIAL_KEYS = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword'];

const mapEmailAttachments = (files = []) =>
  files
    .map((file) => {
      const filename = file.originalName || file.filename;
      if (!filename) {
        return null;
      }

      const absolutePath =
        file.absolutePath ||
        (file.filename ? path.join(uploadsDir, file.filename) : null) ||
        (file.url ? path.join(uploadsDir, path.basename(file.url)) : null);

      if (!absolutePath) {
        return null;
      }

      return {
        filename,
        path: absolutePath,
        contentType: file.mimeType
      };
    })
    .filter(Boolean);

async function deliverEmailMessages({ integration, logs, attachments, content }) {
  const credentials = integration.credentials || {};
  const config = integration.config || {};

  EMAIL_REQUIRED_CREDENTIAL_KEYS.forEach((key) => {
    if (!credentials[key]) {
      throw new Error(`Email integration missing credential: ${key}`);
    }
  });

  if (!config.fromEmail) {
    throw new Error('Email integration missing From Email (fromEmail).');
  }

  const transporter = getEmailTransporter(integration.id, credentials, config);
  const emailAttachments = mapEmailAttachments(attachments);
  const defaultSubject = config.defaultSubject || process.env.DEFAULT_EMAIL_SUBJECT || 'New message';
  const fromName = config.fromName || process.env.APP_NAME || 'MultiDashboard';
  const fromAddress = fromName ? `${fromName} <${config.fromEmail}>` : config.fromEmail;

  for (const log of logs) {
    let targetEmail = log.recipientEmail || log.emailContact?.email;
    let displayName = log.emailContact?.name || null;

    if (!targetEmail && log.recipientUserId) {
      const recipient = await prisma.user.findUnique({
        where: { id: log.recipientUserId },
        select: { email: true, name: true, username: true }
      });

      if (recipient?.email) {
        targetEmail = recipient.email;
        displayName = recipient.name || recipient.username || null;
      }
    }

    if (!targetEmail) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.FAILED,
          error: 'Recipient has no email address.'
        }
      });
      continue;
    }

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: targetEmail,
        subject: log.title || defaultSubject,
        text: content,
        attachments: emailAttachments
      });

      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
          error: null
        }
      });
    } catch (error) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.FAILED,
          error: error.message?.slice(0, 500) || 'Email delivery failed'
        }
      });
    }
  }
}

async function deliverLineMessages({ integration, logs }) {
  const token = integration.credentials?.channelAccessToken;
  if (!token) {
    throw new Error('LINE integration missing channel access token.');
  }

  for (const log of logs) {
    const target = log.lineRecipientId;

    if (!target) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.FAILED,
          error: 'Recipient missing LINE user ID.'
        }
      });
      continue;
    }

    try {
      const messageText = log.title ? `${log.title}\n\n${log.content}` : log.content;
      await sendLinePush({
        accessToken: token,
        to: target,
        text: messageText
      });

      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
          error: null
        }
      });
    } catch (error) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.FAILED,
          error: error.message?.slice(0, 500) || 'LINE delivery failed'
        }
      });
    }
  }
}

async function fetchGroupMembers(groupIds, client = prisma) {
  if (!groupIds.length) {
    return new Map();
  }

  const groups = await client.userGroup.findMany({
    where: { id: { in: groupIds } },
    include: {
      members: {
        select: { userId: true }
      }
    }
  });

  const groupMemberMap = new Map();

  groups.forEach((group) => {
    const memberIds = group.members.map((member) => member.userId);
    groupMemberMap.set(group.id, unique(memberIds));
  });

  return groupMemberMap;
}

export async function logInboundMessage({ userId, content }) {
  const log = await prisma.messageLog.create({
    data: {
      senderId: userId,
      recipientUserId: null,
      direction: MessageDirection.INBOUND,
      channel: MessageChannel.DIRECT,
      source: MessageSource.MANUAL,
      content,
      status: MessageStatus.SENT,
      sentAt: new Date()
    }
  });

  await recordActivity({
    type: ActivityType.MESSAGE_RECEIVE,
    actorId: userId,
    entityId: log.id,
    entityType: 'MESSAGE_LOG'
  });

  return log;
}

export async function sendMessage({
  actorId,
  userIds = [],
  groupIds = [],
  emailRecipients = [],
  lineRecipients = [],
  allowBroadcast = false,
  title = null,
  content,
  source = MessageSource.MANUAL,
  integrationId = null,
  attachments = []
}) {
  if (!content?.trim()) {
    throw new Error('Message content is required.');
  }

  let integration = null;
  if (integrationId) {
    integration = await prisma.userIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.userId !== actorId) {
      throw new Error('Integration not found or not available.');
    }

    if (!integration.isConnected) {
      throw new Error('Integration is currently disabled.');
    }
  }

  const directUserIds = unique(userIds);
  const groupMemberMap = await fetchGroupMembers(unique(groupIds));

  const userRecipients = [];
  directUserIds.forEach((userId) => userRecipients.push({ userId, groupId: null }));

  groupMemberMap.forEach((memberIds, groupId) => {
    memberIds.forEach((memberId) => {
      userRecipients.push({ userId: memberId, groupId });
    });
  });

  const emailRecipientMap = new Map();
  emailRecipients.forEach((recipient) => {
    const normalizedEmail = recipient.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }
    if (!emailRecipientMap.has(normalizedEmail)) {
      emailRecipientMap.set(normalizedEmail, {
        email: normalizedEmail,
        emailContactId: recipient.contactId || null
      });
    }
  });

  const hasRecipients =
    userRecipients.length || emailRecipientMap.size || lineRecipients.length;

  const now = new Date();
  const createdLogs = [];
  const requiresAsyncDelivery =
    integration && [IntegrationType.EMAIL, IntegrationType.LINE].includes(integration.type);
  const initialStatus = requiresAsyncDelivery ? MessageStatus.PENDING : MessageStatus.SENT;
  const initialSentAt = initialStatus === MessageStatus.SENT ? now : null;

  let lineUserMap = new Map();
  if (integration?.type === IntegrationType.LINE && userRecipients.length) {
    const uniqueLineUserIds = unique(userRecipients.map((recipient) => recipient.userId));
    if (uniqueLineUserIds.length) {
      const lineUsers = await prisma.user.findMany({
        where: { id: { in: uniqueLineUserIds } },
        select: { id: true, lineUserId: true }
      });
      lineUsers.forEach((entry) => {
        if (entry.lineUserId) {
          lineUserMap.set(entry.id, entry.lineUserId);
        }
      });
    }
  }

  for (const { userId, groupId } of userRecipients) {
    const log = await prisma.messageLog.create({
      data: {
        senderId: actorId,
        recipientUserId: userId,
        recipientGroupId: groupId,
        direction: MessageDirection.OUTBOUND,
        channel: groupId ? MessageChannel.GROUP : MessageChannel.DIRECT,
        source,
        title,
        content,
        integrationId,
        lineRecipientId: lineUserMap.get(userId) || null,
        status: initialStatus,
        sentAt: initialSentAt,
        createdAt: now,
        updatedAt: now
      }
    });
    createdLogs.push(log);
  }

  for (const { email, emailContactId } of emailRecipientMap.values()) {
    const log = await prisma.messageLog.create({
      data: {
        senderId: actorId,
        recipientUserId: null,
        recipientGroupId: null,
        emailContactId,
        recipientEmail: email,
        direction: MessageDirection.OUTBOUND,
        channel: MessageChannel.DIRECT,
        source,
        title,
        content,
        integrationId,
        status: initialStatus,
        sentAt: initialSentAt,
        createdAt: now,
        updatedAt: now
      }
    });
    createdLogs.push(log);
  }

  for (const { lineUserId, lineContactId } of lineRecipients) {
    const log = await prisma.messageLog.create({
      data: {
        senderId: actorId,
        recipientUserId: null,
        recipientGroupId: null,
        lineContactId,
        lineRecipientId: lineUserId,
        direction: MessageDirection.OUTBOUND,
        channel: MessageChannel.DIRECT,
        source,
        title,
        content,
        integrationId,
        status: initialStatus,
        sentAt: initialSentAt,
        createdAt: now,
        updatedAt: now
      }
    });
    createdLogs.push(log);
  }

  if (!createdLogs.length && allowBroadcast) {
    const log = await prisma.messageLog.create({
      data: {
        senderId: actorId,
        recipientUserId: null,
        recipientGroupId: null,
        direction: MessageDirection.OUTBOUND,
        channel: MessageChannel.BROADCAST,
        source,
        title,
        content,
        integrationId,
        status: MessageStatus.PENDING,
        sentAt: null,
        createdAt: now,
        updatedAt: now
      }
    });
    createdLogs.push(log);
  }

  if (!createdLogs.length) {
    throw new Error('At least one recipient is required.');
  }

  if (attachments.length && createdLogs.length) {
    const attachmentRecords = createdLogs.flatMap((log) =>
      attachments.map((file) => ({
        messageId: log.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url
      }))
    );

    if (attachmentRecords.length) {
      await prisma.messageAttachment.createMany({ data: attachmentRecords });
    }
  }

  await recordActivity({
    type: ActivityType.MESSAGE_SEND,
    actorId,
    entityType: 'MANUAL_MESSAGE',
    metadata: {
      contentPreview: content.slice(0, 120),
      users: createdLogs.map((log) => log.recipientUserId),
      groups: unique(groupIds),
      integrationId,
      emails: Array.from(emailRecipientMap.keys()),
      lineRecipients: createdLogs
        .map((log) => log.lineRecipientId)
        .filter((value) => Boolean(value))
    }
  });

  if (integration && integration.type === IntegrationType.EMAIL && createdLogs.length) {
    const logsWithRelations = await prisma.messageLog.findMany({
      where: { id: { in: createdLogs.map((log) => log.id) } },
      include: {
        emailContact: {
          select: { id: true, name: true, email: true }
        },
        lineContact: {
          select: { id: true, displayName: true, lineUserId: true }
        }
      }
    });

    await deliverEmailMessages({
      integration,
      logs: logsWithRelations,
      attachments,
      content
    });
  } else if (integration && integration.type === IntegrationType.LINE && createdLogs.length) {
    await deliverLineMessages({
      integration,
      logs: createdLogs
    });
  } else if (integration && integration.type === IntegrationType.DISCORD && createdLogs.length) {
    await deliverDiscordMessages({
      integration,
      logs: createdLogs,
      attachments
    });
  }

  return {
    totalRecipients: createdLogs.length,
    userIds: createdLogs.map((log) => log.recipientUserId),
    groupIds: unique(groupIds),
    integrationId
  };
}

export async function createScheduledMessage({
  adminId,
  title,
  content,
  scheduleAt,
  userIds = [],
  groupIds = []
}) {
  if (!content?.trim()) {
    throw new Error('Message content is required.');
  }

  if (!scheduleAt) {
    throw new Error('Schedule time is required.');
  }

  const scheduleDate = new Date(scheduleAt);
  if (Number.isNaN(scheduleDate.getTime())) {
    throw new Error('Invalid schedule time.');
  }

  if (scheduleDate <= new Date()) {
    throw new Error('Schedule time must be in the future.');
  }

  const directUserIds = unique(userIds);
  const uniqueGroupIds = unique(groupIds);

  if (!directUserIds.length && !uniqueGroupIds.length) {
    throw new Error('At least one recipient is required.');
  }

  const scheduledMessage = await prisma.scheduledMessage.create({
    data: {
      adminId,
      title,
      content,
      scheduleAt: scheduleDate,
      status: ScheduledMessageStatus.PENDING,
      recipients: {
        create: [
          ...directUserIds.map((userId) => ({
            recipientType: ScheduledRecipientType.USER,
            userId
          })),
          ...uniqueGroupIds.map((groupId) => ({
            recipientType: ScheduledRecipientType.GROUP,
            groupId
          }))
        ]
      }
    },
    include: {
      recipients: true
    }
  });

  await recordActivity({
    type: ActivityType.MESSAGE_SEND,
    actorId: adminId,
    entityId: scheduledMessage.id,
    entityType: 'SCHEDULED_MESSAGE',
    metadata: {
      scheduleAt: scheduleDate.toISOString(),
      userRecipients: directUserIds,
      groupRecipients: uniqueGroupIds
    }
  });

  return scheduledMessage;
}

export async function cancelScheduledMessage({ scheduledMessageId, adminId }) {
  const scheduledMessage = await prisma.scheduledMessage.findUnique({
    where: { id: scheduledMessageId }
  });

  if (!scheduledMessage) {
    throw new Error('Scheduled message not found.');
  }

  if (scheduledMessage.status === ScheduledMessageStatus.CANCELLED) {
    return scheduledMessage;
  }

  const updated = await prisma.scheduledMessage.update({
    where: { id: scheduledMessageId },
    data: {
      status: ScheduledMessageStatus.CANCELLED,
      lastProcessedAt: new Date()
    }
  });

  await recordActivity({
    type: ActivityType.MESSAGE_FAIL,
    actorId: adminId,
    entityId: scheduledMessageId,
    entityType: 'SCHEDULED_MESSAGE',
    metadata: { action: 'CANCEL' }
  });

  return updated;
}

async function deliverScheduledMessage(scheduledMessage) {
  const { id, adminId, content, recipients } = scheduledMessage;
  const directRecipients = recipients
    .filter((recipient) => recipient.recipientType === ScheduledRecipientType.USER && recipient.userId)
    .map((recipient) => recipient.userId);

  const groupRecipients = recipients
    .filter((recipient) => recipient.recipientType === ScheduledRecipientType.GROUP && recipient.groupId)
    .map((recipient) => recipient.groupId);

  const groupMemberMap = await fetchGroupMembers(groupRecipients);

  const recipientPayloads = [];

  unique(directRecipients).forEach((userId) => {
    recipientPayloads.push({
      recipientUserId: userId,
      recipientGroupId: null,
      channel: MessageChannel.DIRECT
    });
  });

  groupMemberMap.forEach((memberIds, groupId) => {
    memberIds.forEach((userId) => {
      recipientPayloads.push({
        recipientUserId: userId,
        recipientGroupId: groupId,
        channel: MessageChannel.GROUP
      });
    });
  });

  if (!recipientPayloads.length) {
    throw new Error('Scheduled message has no valid recipients.');
  }

  const now = new Date();

  await prisma.messageLog.createMany({
    data: recipientPayloads.map((payload) => ({
      senderId: adminId,
      recipientUserId: payload.recipientUserId,
      recipientGroupId: payload.recipientGroupId,
      direction: MessageDirection.OUTBOUND,
      channel: payload.channel,
      source: MessageSource.SCHEDULED,
      content,
      scheduledMessageId: id,
      status: MessageStatus.SENT,
      sentAt: now,
      createdAt: now,
      updatedAt: now
    }))
  });

  await recordActivity({
    type: ActivityType.MESSAGE_SEND,
    actorId: adminId,
    entityId: id,
    entityType: 'SCHEDULED_MESSAGE',
    metadata: {
      deliveredAt: now.toISOString(),
      recipients: recipientPayloads.map((payload) => payload.recipientUserId),
      groups: groupRecipients
    }
  });

  return recipientPayloads.length;
}

export async function processDueScheduledMessages() {
  const now = new Date();
  const dueMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: {
        in: [ScheduledMessageStatus.PENDING, ScheduledMessageStatus.PROCESSING]
      },
      scheduleAt: {
        lte: now
      }
    },
    include: {
      recipients: true
    },
    orderBy: {
      scheduleAt: 'asc'
    },
    take: 10
  });

  for (const message of dueMessages) {
    try {
      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: ScheduledMessageStatus.PROCESSING,
          lastProcessedAt: now
        }
      });

      const deliveredCount = await deliverScheduledMessage(message);

      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: ScheduledMessageStatus.SENT,
          lastProcessedAt: new Date(),
          error: null
        }
      });

      console.log(
        `Scheduled message ${message.id} delivered to ${deliveredCount} recipient(s).`
      );
    } catch (error) {
      console.error(`Scheduled message ${message.id} failed:`, error);
      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: ScheduledMessageStatus.FAILED,
          lastProcessedAt: new Date(),
          error: error.message?.slice(0, 500) ?? 'Unknown error'
        }
      });

      await recordActivity({
        type: ActivityType.MESSAGE_FAIL,
        actorId: message.adminId,
        entityId: message.id,
        entityType: 'SCHEDULED_MESSAGE',
        metadata: { error: error.message }
      });
    }
  }
}


export {
  MessageChannel,
  MessageDirection,
  MessageSource,
  MessageStatus,
  ScheduledMessageStatus,
  ScheduledRecipientType
};



async function deliverDiscordMessages({ integration, logs, attachments }) {
  const webhookUrl = integration.credentials?.webhookUrl;
  if (!webhookUrl) {
    throw new Error('Discord integration missing webhook URL.');
  }

  const attachmentNotes = attachments
    ?.map((file) => {
      const publicBase = process.env.PUBLIC_BASE_URL || '';
      const url = file.url?.startsWith('http') ? file.url : `${publicBase}${file.url || ''}`;
      return url ? `\n📎 ${file.originalName || file.filename || 'file'}: ${url}` : '';
    })
    .filter(Boolean)
    .join('');

  for (const log of logs) {
    try {
      const messageText = log.title ? `**${log.title}**\n${log.content}` : log.content;
      await sendDiscordMessage({
        webhookUrl,
        content: `${messageText}${attachmentNotes || ''}`.trim()
      });

      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
          error: null
        }
      });
    } catch (error) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: {
          status: MessageStatus.FAILED,
          error: error.message?.slice(0, 500) || 'Discord delivery failed'
        }
      });
    }
  }
}
