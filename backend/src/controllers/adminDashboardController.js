import prisma from '../config/database.js';
import { MessageDirection, ScheduledMessageStatus } from '@prisma/client';

export async function getDashboardMetrics(req, res) {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalAdmins,
      outbound24h,
      inbound24h,
      scheduledPending,
      scheduledSentWeek,
      recentMessages
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.messageLog.count({
        where: {
          direction: MessageDirection.OUTBOUND,
          createdAt: { gte: dayAgo }
        }
      }),
      prisma.messageLog.count({
        where: {
          direction: MessageDirection.INBOUND,
          createdAt: { gte: dayAgo }
        }
      }),
      prisma.scheduledMessage.count({
        where: {
          status: {
            in: [ScheduledMessageStatus.PENDING, ScheduledMessageStatus.PROCESSING]
          }
        }
      }),
      prisma.scheduledMessage.count({
        where: {
          status: ScheduledMessageStatus.SENT,
          lastProcessedAt: { gte: weekAgo }
        }
      }),
      prisma.messageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          recipientUser: {
            select: { id: true, username: true, name: true }
          },
          sender: {
            select: { id: true, username: true, name: true }
          }
        }
      })
    ]);

    const activeUsers = await prisma.messageLog.groupBy({
      by: ['recipientUserId'],
      where: {
        recipientUserId: { not: null },
        createdAt: { gte: weekAgo }
      },
      _count: true
    });

    res.json({
      metrics: {
        totals: {
          users: totalUsers,
          admins: totalAdmins
        },
        messaging: {
          outboundLast24h: outbound24h,
          inboundLast24h: inbound24h,
          scheduledPending,
          scheduledSentLast7d: scheduledSentWeek
        },
        activeUsers: activeUsers.length,
        recentMessages
      }
    });
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
}
