import crypto from 'crypto';
import prisma from '../config/database.js';
import { getLineProfile } from '../providers/lineProvider.js';

async function upsertLineContact({ integration, accessToken, lineUserId }) {
  if (!lineUserId) {
    return;
  }

  let profile = null;
  try {
    profile = await getLineProfile({ accessToken, userId: lineUserId });
  } catch (error) {
    console.warn('LINE profile fetch failed:', error.message);
  }

  const now = new Date();

  await prisma.lineContact.upsert({
    where: {
      integrationId_lineUserId: {
        integrationId: integration.id,
        lineUserId
      }
    },
    update: {
      displayName: profile?.displayName ?? undefined,
      pictureUrl: profile?.pictureUrl ?? undefined,
      language: profile?.language ?? undefined,
      statusMessage: profile?.statusMessage ?? undefined,
      lastEventAt: now
    },
    create: {
      userId: integration.userId,
      integrationId: integration.id,
      lineUserId,
      displayName: profile?.displayName ?? null,
      pictureUrl: profile?.pictureUrl ?? null,
      language: profile?.language ?? null,
      statusMessage: profile?.statusMessage ?? null,
      lastEventAt: now
    }
  });
}

const verifySignature = (channelSecret, rawBody, signature) => {
  if (!rawBody || !signature) {
    return false;
  }
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');
  return hash === signature;
};

const extractUserIdsFromEvent = (event) => {
  const userIds = new Set();
  const baseUserId = event?.source?.userId;
  if (baseUserId) {
    userIds.add(baseUserId);
  }

  if (event?.joined?.members?.length) {
    event.joined.members.forEach((member) => {
      if (member.userId) {
        userIds.add(member.userId);
      }
    });
  }

  if (event?.type === 'memberJoined' && event?.joined?.members?.length) {
    event.joined.members.forEach((member) => {
      if (member.userId) {
        userIds.add(member.userId);
      }
    });
  }

  return [...userIds];
};

export async function handleLineWebhook(req, res) {
  try {
    const { integrationId } = req.params;
    const integration = await prisma.userIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || integration.type !== 'LINE') {
      return res.status(404).json({ error: 'Integration not found.' });
    }

    const channelSecret = integration.credentials?.channelSecret;
    const channelAccessToken = integration.credentials?.channelAccessToken;

    if (!channelSecret || !channelAccessToken) {
      return res.status(400).json({ error: 'LINE integration missing credentials.' });
    }

    const signature = req.get('x-line-signature');
    if (!verifySignature(channelSecret, req.rawBody, signature)) {
      return res.status(403).json({ error: 'Invalid signature.' });
    }

    const events = req.body?.events || [];

    for (const event of events) {
      const userIds = extractUserIdsFromEvent(event);
      for (const lineUserId of userIds) {
        try {
          await upsertLineContact({
            integration,
            accessToken: channelAccessToken,
            lineUserId
          });
        } catch (error) {
          console.error('upsertLineContact error:', error.message);
        }
      }
    }

    res.json({ received: events.length });
  } catch (error) {
    console.error('handleLineWebhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook.' });
  }
}
