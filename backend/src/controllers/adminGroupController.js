import prisma from '../config/database.js';
import { recordActivity, ActivityType } from '../services/activityService.js';

const GROUP_INCLUDE = {
  members: {
    include: {
      user: {
        select: { id: true, username: true, name: true, email: true }
      }
    }
  }
};

export async function listGroups(req, res) {
  try {
    const groups = await prisma.userGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: GROUP_INCLUDE
    });

    res.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        createdById: group.createdById,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        members: group.members.map((member) => ({
          id: member.id,
          user: member.user,
          addedAt: member.addedAt
        }))
      }))
    });
  } catch (error) {
    console.error('listGroups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
}

export async function createGroup(req, res) {
  try {
    const { name, description, memberIds = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const group = await prisma.userGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: req.user.id,
        members: {
          create: memberIds.map((userId) => ({
            userId
          }))
        }
      },
      include: GROUP_INCLUDE
    });

    await recordActivity({
      type: ActivityType.GROUP_CREATE,
      actorId: req.user.id,
      entityId: group.id,
      entityType: 'USER_GROUP',
      metadata: {
        memberCount: memberIds.length
      }
    });

    res.status(201).json({ group });
  } catch (error) {
    console.error('createGroup error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Group name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create group.' });
  }
}

export async function updateGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Group name cannot be empty.' });
      }
      data.name = name.trim();
    }

    if (description !== undefined) {
      data.description = description?.trim() || null;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    const group = await prisma.userGroup.update({
      where: { id: groupId },
      data,
      include: GROUP_INCLUDE
    });

    await recordActivity({
      type: ActivityType.GROUP_UPDATE,
      actorId: req.user.id,
      entityId: groupId,
      entityType: 'USER_GROUP',
      metadata: { fields: Object.keys(data) }
    });

    res.json({ group });
  } catch (error) {
    console.error('updateGroup error:', error);
    res.status(500).json({ error: 'Failed to update group.' });
  }
}

export async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params;

    await prisma.userGroup.delete({
      where: { id: groupId }
    });

    await recordActivity({
      type: ActivityType.GROUP_DELETE,
      actorId: req.user.id,
      entityId: groupId,
      entityType: 'USER_GROUP'
    });

    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('deleteGroup error:', error);
    res.status(500).json({ error: 'Failed to delete group.' });
  }
}

export async function addGroupMembers(req, res) {
  try {
    const { groupId } = req.params;
    const { memberIds = [] } = req.body;

    if (!memberIds.length) {
      return res.status(400).json({ error: 'memberIds array is required.' });
    }

    const uniqueMemberIds = [...new Set(memberIds)];

    await prisma.userGroupMember.createMany({
      data: uniqueMemberIds.map((userId) => ({
        groupId,
        userId
      })),
      skipDuplicates: true
    });

    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: GROUP_INCLUDE
    });

    res.json({ group });
  } catch (error) {
    console.error('addGroupMembers error:', error);
    res.status(500).json({ error: 'Failed to add members.' });
  }
}

export async function removeGroupMember(req, res) {
  try {
    const { groupId, userId } = req.params;

    await prisma.userGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: GROUP_INCLUDE
    });

    res.json({ group });
  } catch (error) {
    console.error('removeGroupMember error:', error);
    res.status(500).json({ error: 'Failed to remove group member.' });
  }
}
