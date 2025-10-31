import { MessageDirection } from '@prisma/client';
import prisma from '../config/database.js';
import { sendMessage } from '../services/messageService.js';

function normalizeToArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value].filter(Boolean);
}

export async function sendUserMessage(req, res) {
  try {
    const { content } = req.body;
    const userIds = normalizeToArray(req.body.userIds);
    const groupIds = normalizeToArray(req.body.groupIds);
    const emailContactIds = normalizeToArray(req.body.contactIds);
    const emailGroupIds = normalizeToArray(req.body.contactGroupIds);
    const emailAddresses = normalizeToArray(req.body.emailAddresses).map((email) =>
      email?.trim().toLowerCase()
    );
    const lineContactIds = normalizeToArray(req.body.lineContactIds);
    const lineGroupIds = normalizeToArray(req.body.lineGroupIds);
    const lineUserIds = normalizeToArray(req.body.lineUserIds);
    const integrationIds = normalizeToArray(req.body.integrationIds);
    const subject = req.body.subject?.trim() || null;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (!integrationIds.length) {
      return res.status(400).json({ error: 'Select at least one integration.' });
    }

    const emailContacts = emailContactIds.length
      ? await prisma.emailContact.findMany({
          where: {
            id: { in: emailContactIds },
            userId: req.user.id
          }
        })
      : [];

    if (emailContacts.length !== emailContactIds.length) {
      return res.status(400).json({ error: 'Some email contacts were not found.' });
    }

    const emailGroups = emailGroupIds.length
      ? await prisma.emailContactGroup.findMany({
          where: {
            id: { in: emailGroupIds },
            userId: req.user.id
          },
          include: {
            members: {
              include: {
                contact: true
              }
            }
          }
        })
      : [];

    if (emailGroups.length !== emailGroupIds.length) {
      return res.status(400).json({ error: 'Some email groups were not found.' });
    }

    const emailRecipientMap = new Map();
    const registerEmailRecipient = (email, contactId = null) => {
      const normalized = email?.trim().toLowerCase();
      if (!normalized) {
        return;
      }
      if (!emailRecipientMap.has(normalized)) {
        emailRecipientMap.set(normalized, { email: normalized, contactId });
      }
    };

    emailContacts.forEach((contact) => registerEmailRecipient(contact.email, contact.id));
    emailGroups.forEach((group) => {
      group.members.forEach((member) =>
        registerEmailRecipient(member.contact.email, member.contact.id)
      );
    });
    emailAddresses.forEach((email) => registerEmailRecipient(email));

    const emailRecipients = Array.from(emailRecipientMap.values());

    const lineContacts = lineContactIds.length
      ? await prisma.lineContact.findMany({
          where: {
            id: { in: lineContactIds },
            userId: req.user.id
          }
        })
      : [];

    if (lineContacts.length !== lineContactIds.length) {
      return res.status(400).json({ error: 'Some LINE contacts were not found.' });
    }

    const lineGroups = lineGroupIds.length
      ? await prisma.lineContactGroup.findMany({
          where: {
            id: { in: lineGroupIds },
            userId: req.user.id
          },
          include: {
            members: {
              include: {
                contact: true
              }
            }
          }
        })
      : [];

    if (lineGroups.length !== lineGroupIds.length) {
      return res.status(400).json({ error: 'Some LINE groups were not found.' });
    }

    const lineRecipientMap = new Map();
    const addLineRecipient = (integrationId, lineUserId, lineContactId = null) => {
      const normalized = lineUserId?.trim();
      if (!integrationId || !normalized) {
        return;
      }
      if (!lineRecipientMap.has(integrationId)) {
        lineRecipientMap.set(integrationId, []);
      }
      const recipients = lineRecipientMap.get(integrationId);
      if (!recipients.some((recipient) => recipient.lineUserId === normalized)) {
        recipients.push({ lineUserId: normalized, lineContactId });
      }
    };

    lineContacts.forEach((contact) =>
      addLineRecipient(contact.integrationId, contact.lineUserId, contact.id)
    );
    lineGroups.forEach((group) => {
      group.members.forEach((member) =>
        addLineRecipient(member.contact.integrationId, member.contact.lineUserId, member.contact.id)
      );
    });

    const manualLineUserIds = lineUserIds.map((id) => id?.trim()).filter(Boolean);

    if (!userIds.length && !groupIds.length && !emailRecipients.length && !lineRecipientMap.size && !manualLineUserIds.length) {
      return res.status(400).json({ error: 'Select at least one recipient (user, group, email, or LINE).' });
    }

    if (groupIds.length) {
      const validMemberships = await prisma.userGroupMember.count({
        where: {
          groupId: { in: groupIds },
          userId: req.user.id
        }
      });

      if (validMemberships !== groupIds.length) {
        return res.status(403).json({ error: 'You can only message groups you belong to.' });
      }
    }

    const integrations = await prisma.userIntegration.findMany({
      where: {
        id: { in: integrationIds },
        userId: req.user.id,
        isConnected: true
      }
    });

    if (!integrations.length) {
      return res.status(400).json({ error: 'No valid integrations selected.' });
    }

    if (integrations.length !== integrationIds.length) {
      return res.status(400).json({ error: 'Some integrations are invalid or disconnected.' });
    }

    const hasRecipients =
      userIds.length ||
      groupIds.length ||
      emailRecipients.length ||
      lineRecipientMap.size;

    const hasDiscordIntegration = integrations.some((integration) => integration.type === 'DISCORD');

        if (!hasRecipients && !hasDiscordIntegration) {
      return res.status(400).json({
        error: 'Select at least one recipient (user, group, email, or LINE).'
      });
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      absolutePath: file.path
    }));

    const emailIntegrations = integrations.filter((integration) => integration.type === 'EMAIL');
    const lineIntegrations = integrations.filter((integration) => integration.type === 'LINE');

    if (emailRecipients.length && !emailIntegrations.length) {
      return res.status(400).json({ error: 'Email recipients require selecting an Email integration.' });
    }

    if (manualLineUserIds.length) {
      if (lineIntegrations.length !== 1) {
        return res.status(400).json({ error: 'Manual LINE IDs require selecting exactly one LINE integration.' });
      }
      manualLineUserIds.forEach((lineUserId) =>
        addLineRecipient(lineIntegrations[0].id, lineUserId, null)
      );
    }

    for (const integrationId of lineRecipientMap.keys()) {
      if (!integrations.some((integration) => integration.id === integrationId)) {
        return res.status(400).json({ error: 'Select the LINE integration that owns the chosen contacts/groups.' });
      }
    }

    const results = [];
    for (const integration of integrations) {
      const isEmailIntegration = integration.type === 'EMAIL';
      const isLineIntegration = integration.type === 'LINE';
      const lineRecipients = lineRecipientMap.get(integration.id) || [];

      const result = await sendMessage({
        actorId: req.user.id,
        userIds,
        groupIds,
        emailRecipients: isEmailIntegration ? emailRecipients : [],
        lineRecipients: isLineIntegration ? lineRecipients : [],
        title: isEmailIntegration ? subject : null,
        content,
        integrationId: integration.id,
        attachments,
        allowBroadcast: !hasRecipients && integration.type === 'DISCORD'
      });
      results.push({
        integrationId: integration.id,
        integrationType: integration.type,
        ...result
      });
    }

    res.status(201).json({
      message: 'Message dispatched.',
      results
    });
  } catch (error) {
    console.error('sendUserMessage error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
}

export async function listSentMessages(req, res) {
  try {
    const { limit = 50 } = req.query;

    const logs = await prisma.messageLog.findMany({
      where: {
        senderId: req.user.id
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      include: {
        integration: {
          select: { id: true, type: true, name: true }
        },
        attachments: true,
        recipientUser: {
          select: { id: true, username: true, name: true, email: true }
        },
        recipientGroup: {
          select: { id: true, name: true }
        },
        emailContact: {
          select: { id: true, name: true, email: true }
        },
        lineContact: {
          select: { id: true, displayName: true, lineUserId: true }
        }
      }
    });

    res.json({ messages: logs });
  } catch (error) {
    console.error('listSentMessages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
}

export async function listNotifications(req, res) {
  try {
    const { limit = 50 } = req.query;

    const notifications = await prisma.messageLog.findMany({
      where: {
        recipientUserId: req.user.id,
        direction: MessageDirection.OUTBOUND,
        senderId: { not: req.user.id }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      include: {
        sender: {
          select: { id: true, username: true, name: true, email: true }
        },
        attachments: true,
        integration: {
          select: { id: true, type: true, name: true }
        }
      }
    });

    res.json({ notifications });
  } catch (error) {
    console.error('listNotifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function listRecipientUsers(req, res) {
  try {
    const { search = '', limit = 50 } = req.query;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ],
        id: { not: req.user.id }
      },
      orderBy: { username: 'asc' },
      take: Math.min(Number(limit) || 50, 200),
      select: {
        id: true,
        username: true,
        name: true,
        email: true
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('listRecipientUsers error:', error);
    res.status(500).json({ error: 'Failed to load users.' });
  }
}

export async function listRecipientGroups(req, res) {
  try {
    const groups = await prisma.userGroup.findMany({
      where: {
        OR: [
          { createdById: req.user.id },
          {
            members: {
              some: {
                userId: req.user.id
              }
            }
          }
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        members: {
          select: { userId: true }
        }
      }
    });

    res.json({ groups });
  } catch (error) {
    console.error('listRecipientGroups error:', error);
    res.status(500).json({ error: 'Failed to load groups.' });
  }
}
