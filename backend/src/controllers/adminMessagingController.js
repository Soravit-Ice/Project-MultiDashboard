import prisma from '../config/database.js';
import { MessageDirection, sendMessage, logInboundMessage } from '../services/messageService.js';

export async function getMessageLogs(req, res) {
  try {
    const {
      direction,
      userId,
      groupId,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const where = {};

    if (direction && ['INBOUND', 'OUTBOUND'].includes(direction)) {
      where.direction = direction;
    }

    if (userId) {
      where.OR = [
        { recipientUserId: userId },
        { senderId: userId }
      ];
    }

    if (groupId) {
      where.recipientGroupId = groupId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const logs = await prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      include: {
        recipientUser: {
          select: { id: true, username: true, name: true, email: true }
        },
        recipientGroup: {
          select: { id: true, name: true }
        },
        sender: {
          select: { id: true, username: true, name: true, email: true }
        }
      }
    });

    res.json({ logs });
  } catch (error) {
    console.error('getMessageLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch message logs.' });
  }
}

export async function sendManualMessageHandler(req, res) {
  try {
    const { userIds = [], groupIds = [], content } = req.body;

    const result = await sendMessage({
      actorId: req.user.id,
      userIds,
      groupIds,
      content
    });

    res.status(201).json({
      message: 'Message sent successfully.',
      result
    });
  } catch (error) {
    console.error('sendManualMessageHandler error:', error);
    res.status(400).json({ error: error.message || 'Failed to send message.' });
  }
}

export async function logInboundMessageHandler(req, res) {
  try {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required.' });
    }

    const log = await logInboundMessage({ userId, content });

    res.status(201).json({ log });
  } catch (error) {
    console.error('logInboundMessageHandler error:', error);
    res.status(500).json({ error: 'Failed to log inbound message.' });
  }
}

function extractThreadUsers(logs) {
  const threadMap = new Map();

  logs.forEach((log) => {
    const userId = log.direction === MessageDirection.INBOUND ? log.senderId : log.recipientUserId;
    if (!userId) {
      return;
    }

    if (!threadMap.has(userId)) {
      threadMap.set(userId, {
        userId,
        lastMessageAt: log.createdAt,
        lastDirection: log.direction,
        lastContent: log.content
      });
    }
  });

  return [...threadMap.values()];
}

export async function listChatThreads(req, res) {
  try {
    const logs = await prisma.messageLog.findMany({
      where: {
        OR: [
          { senderId: { not: null } },
          { recipientUserId: { not: null } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sender: {
          select: { id: true, username: true, name: true, email: true }
        },
        recipientUser: {
          select: { id: true, username: true, name: true, email: true }
        }
      }
    });

    const threads = extractThreadUsers(logs);

    const userIds = threads.map((thread) => thread.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, name: true, email: true }
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    res.json({
      threads: threads.map((thread) => ({
        ...thread,
        user: userMap.get(thread.userId) || null
      }))
    });
  } catch (error) {
    console.error('listChatThreads error:', error);
    res.status(500).json({ error: 'Failed to fetch chat threads.' });
  }
}

export async function getChatMessages(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const messages = await prisma.messageLog.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            direction: MessageDirection.INBOUND
          },
          {
            recipientUserId: userId,
            direction: MessageDirection.OUTBOUND
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: Math.min(Number(limit) || 100, 500)
    });

    res.json({ messages });
  } catch (error) {
    console.error('getChatMessages error:', error);
    res.status(500).json({ error: 'Failed to load chat messages.' });
  }
}

export async function sendChatMessage(req, res) {
  try {
    const { userId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const result = await sendMessage({
      actorId: req.user.id,
      userIds: [userId],
      groupIds: [],
      content
    });

    res.status(201).json({
      message: 'Chat message sent.',
      result
    });
  } catch (error) {
    console.error('sendChatMessage error:', error);
    res.status(400).json({ error: error.message || 'Failed to send chat message.' });
  }
}
