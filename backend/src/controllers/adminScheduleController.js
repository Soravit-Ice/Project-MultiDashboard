import prisma from '../config/database.js';
import {
  createScheduledMessage,
  cancelScheduledMessage,
  processDueScheduledMessages,
  ScheduledMessageStatus
} from '../services/messageService.js';

export async function createSchedule(req, res) {
  try {
    const { title, content, scheduleAt, userIds = [], groupIds = [] } = req.body;

    const scheduledMessage = await createScheduledMessage({
      adminId: req.user.id,
      title,
      content,
      scheduleAt,
      userIds,
      groupIds
    });

    res.status(201).json({ scheduledMessage });
  } catch (error) {
    console.error('createSchedule error:', error);
    res.status(400).json({ error: error.message || 'Failed to create scheduled message.' });
  }
}

export async function listSchedules(req, res) {
  try {
    const {
      status,
      limit = 50
    } = req.query;

    const where = {
      adminId: req.user.id
    };

    if (status && ScheduledMessageStatus[status]) {
      where.status = status;
    }

    const messages = await prisma.scheduledMessage.findMany({
      where,
      orderBy: { scheduleAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      include: {
        recipients: true,
        messageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    res.json({ messages });
  } catch (error) {
    console.error('listSchedules error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled messages.' });
  }
}

export async function rescheduleMessage(req, res) {
  try {
    const { scheduleId } = req.params;
    const { scheduleAt } = req.body;

    if (!scheduleAt) {
      return res.status(400).json({ error: 'scheduleAt is required.' });
    }

    const newDate = new Date(scheduleAt);
    if (Number.isNaN(newDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduleAt value.' });
    }

    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id: scheduleId }
    });

    if (!scheduledMessage || scheduledMessage.adminId !== req.user.id) {
      return res.status(404).json({ error: 'Scheduled message not found.' });
    }

    if (
      [ScheduledMessageStatus.SENT, ScheduledMessageStatus.CANCELLED].includes(
        scheduledMessage.status
      )
    ) {
      return res.status(400).json({ error: 'Cannot reschedule sent or cancelled message.' });
    }

    const updated = await prisma.scheduledMessage.update({
      where: { id: scheduleId },
      data: {
        scheduleAt: newDate,
        status: ScheduledMessageStatus.PENDING,
        lastProcessedAt: null,
        error: null
      },
      include: {
        recipients: true
      }
    });

    res.json({ scheduledMessage: updated });
  } catch (error) {
    console.error('rescheduleMessage error:', error);
    res.status(500).json({ error: 'Failed to reschedule message.' });
  }
}

export async function cancelSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    const cancelled = await cancelScheduledMessage({
      scheduledMessageId: scheduleId,
      adminId: req.user.id
    });

    res.json({ scheduledMessage: cancelled });
  } catch (error) {
    console.error('cancelSchedule error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel scheduled message.' });
  }
}

export async function triggerSchedulerNow(req, res) {
  try {
    await processDueScheduledMessages();
    res.json({ message: 'Scheduler run completed.' });
  } catch (error) {
    console.error('triggerSchedulerNow error:', error);
    res.status(500).json({ error: 'Failed to run scheduler.' });
  }
}
