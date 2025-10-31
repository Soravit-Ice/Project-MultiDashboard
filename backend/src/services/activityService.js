import { ActivityType } from '@prisma/client';
import prisma from '../config/database.js';

/**
 * Persist an entry in the activity log. Errors are swallowed to avoid blocking flows.
 */
export async function recordActivity({
  type,
  actorId = null,
  entityId = null,
  entityType = null,
  metadata = null
}) {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        actorId,
        entityId,
        entityType,
        metadata
      }
    });
  } catch (error) {
    console.error('recordActivity error:', error);
  }
}

export { ActivityType };
