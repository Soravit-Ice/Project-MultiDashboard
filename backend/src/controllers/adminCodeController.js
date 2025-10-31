import prisma from '../config/database.js';
import { recordActivity, ActivityType } from '../services/activityService.js';

export async function listAdminCodes(req, res) {
  try {
    const codes = await prisma.adminCode.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 10,
          include: {
            usedBy: {
              select: { id: true, username: true, email: true }
            }
          }
        }
      }
    });

    res.json({ codes });
  } catch (error) {
    console.error('listAdminCodes error:', error);
    res.status(500).json({ error: 'Failed to fetch admin codes.' });
  }
}

export async function createAdminCode(req, res) {
  try {
    const {
      code,
      description,
      expiresAt,
      maxUses
    } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const created = await prisma.adminCode.create({
      data: {
        code: code.trim(),
        description: description?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses ?? null,
        createdById: req.user.id
      }
    });

    await recordActivity({
      type: ActivityType.CODE_CREATE,
      actorId: req.user.id,
      entityId: created.id,
      entityType: 'ADMIN_CODE'
    });

    res.status(201).json({ code: created });
  } catch (error) {
    console.error('createAdminCode error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Code already exists.' });
    }
    res.status(500).json({ error: 'Failed to create code.' });
  }
}

export async function deactivateAdminCode(req, res) {
  try {
    const { codeId } = req.params;

    const existing = await prisma.adminCode.findUnique({
      where: { id: codeId }
    });

    if (!existing || existing.createdById !== req.user.id) {
      return res.status(404).json({ error: 'Code not found.' });
    }

    const updated = await prisma.adminCode.update({
      where: { id: codeId },
      data: {
        isActive: false
      }
    });

    await recordActivity({
      type: ActivityType.CODE_DISABLE,
      actorId: req.user.id,
      entityId: codeId,
      entityType: 'ADMIN_CODE'
    });

    res.json({ code: updated });
  } catch (error) {
    console.error('deactivateAdminCode error:', error);
    res.status(500).json({ error: 'Failed to deactivate code.' });
  }
}

export async function deleteAdminCode(req, res) {
  try {
    const { codeId } = req.params;

    const existing = await prisma.adminCode.findUnique({
      where: { id: codeId }
    });

    if (!existing || existing.createdById !== req.user.id) {
      return res.status(404).json({ error: 'Code not found.' });
    }

    await prisma.adminCode.delete({
      where: { id: codeId }
    });

    res.json({ message: 'Code deleted successfully.' });
  } catch (error) {
    console.error('deleteAdminCode error:', error);
    res.status(500).json({ error: 'Failed to delete code.' });
  }
}
