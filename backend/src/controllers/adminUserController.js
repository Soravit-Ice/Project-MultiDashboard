import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { recordActivity, ActivityType } from '../services/activityService.js';

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  lineUserId: true,
  createdAt: true,
  updatedAt: true
};

export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('listUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

export async function createUser(req, res) {
  try {
    const { email, username, password, name, lineUserId, role = 'USER' } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? 'Email already exists.' : 'Username already exists.'
      });
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name: name || username,
          lineUserId: lineUserId?.trim() || null,
          role
        },
        select: USER_SELECT
      });

      await recordActivity({
        type: ActivityType.USER_CREATE,
        actorId: req.user.id,
        entityId: user.id,
        entityType: 'USER'
      });

      res.status(201).json({ user });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email, username, or LINE User ID already exists.' });
      }
      throw error;
    }
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { email, username, name, password, lineUserId } = req.body;

    const updates = {};

    if (email) {
      updates.email = email;
    }
    if (username) {
      updates.username = username;
    }
    if (name !== undefined) {
      updates.name = name;
    }
    if (password) {
      updates.password = await bcrypt.hash(password, 12);
    }
    if (lineUserId !== undefined) {
      updates.lineUserId = lineUserId?.trim() || null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: USER_SELECT
      });

      await recordActivity({
        type: ActivityType.USER_UPDATE,
        actorId: req.user.id,
        entityId: userId,
        entityType: 'USER',
        metadata: { fields: Object.keys(updates) }
      });

      res.json({ user });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email, username, or LINE User ID already exists.' });
      }
      throw error;
    }
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_SELECT
    });

    await recordActivity({
      type: ActivityType.USER_UPDATE,
      actorId: req.user.id,
      entityId: userId,
      entityType: 'USER',
      metadata: { field: 'role', value: role }
    });

    res.json({
      message: 'User role updated successfully.',
      user
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update role.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    await prisma.session.deleteMany({
      where: { userId }
    });

    await prisma.user.delete({
      where: { id: userId }
    });

    await recordActivity({
      type: ActivityType.USER_DELETE,
      actorId: req.user.id,
      entityId: userId,
      entityType: 'USER'
    });

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}
