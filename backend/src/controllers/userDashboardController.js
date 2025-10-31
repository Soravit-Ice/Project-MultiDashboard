import prisma from '../config/database.js';

export async function getUserDashboard(req, res) {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalSent, sentLast24h, attachmentsSent, perIntegration, recentMessages] =
      await Promise.all([
        prisma.messageLog.count({
          where: { senderId: req.user.id }
        }),
        prisma.messageLog.count({
          where: {
            senderId: req.user.id,
            createdAt: { gte: dayAgo }
          }
        }),
        prisma.messageAttachment.count({
          where: {
            message: {
              senderId: req.user.id
            }
          }
        }),
        prisma.messageLog.groupBy({
          by: ['integrationId'],
          where: {
            senderId: req.user.id,
            integrationId: { not: null }
          },
          _count: { _all: true }
        }),
        prisma.messageLog.findMany({
          where: { senderId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            integration: {
              select: { id: true, type: true, name: true }
            },
            recipientUser: {
              select: { id: true, username: true, name: true }
            },
            recipientGroup: {
              select: { id: true, name: true }
            },
            attachments: true
          }
        })
      ]);

    const integrationIds = perIntegration
      .map((item) => item.integrationId)
      .filter(Boolean);

    const integrationDetails = await prisma.userIntegration.findMany({
      where: { id: { in: integrationIds } },
      select: { id: true, type: true, name: true }
    });

    const integrationMap = new Map(
      integrationDetails.map((integration) => [integration.id, integration])
    );

    const integrationStats = perIntegration.map((item) => ({
      integrationId: item.integrationId,
      count: item._count._all,
      integration: integrationMap.get(item.integrationId) || null
    }));

    res.json({
      metrics: {
        totalSent,
        sentLast24h,
        attachmentsSent,
        integrationStats,
        recentMessages
      }
    });
  } catch (error) {
    console.error('getUserDashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
}
