import prisma from '../config/database.js';

export async function listEmailContacts(req, res) {
  try {
    const contacts = await prisma.emailContact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        groupLinks: {
          include: {
            group: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    res.json({
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        groups: contact.groupLinks.map((link) => link.group)
      }))
    });
  } catch (error) {
    console.error('listEmailContacts error:', error);
    res.status(500).json({ error: 'Failed to load contacts.' });
  }
}

export async function createEmailContact(req, res) {
  try {
    const { name, email, groupIds = [] } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const uniqueGroupIds = [...new Set(groupIds)].filter(Boolean);

    const contact = await prisma.$transaction(async (tx) => {
      const newContact = await tx.emailContact.create({
        data: {
          userId: req.user.id,
          name: name?.trim() || null,
          email: email.trim().toLowerCase()
        }
      });

      if (uniqueGroupIds.length) {
        const groups = await tx.emailContactGroup.findMany({
          where: {
            id: { in: uniqueGroupIds },
            userId: req.user.id
          }
        });

        await tx.emailContactGroupMember.createMany({
          data: groups.map((group) => ({
            groupId: group.id,
            contactId: newContact.id
          }))
        });
      }

      return newContact;
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('createEmailContact error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create contact.' });
  }
}

export async function updateEmailContact(req, res) {
  try {
    const { contactId } = req.params;
    const { name, email, groupIds } = req.body;

    const contact = await prisma.emailContact.findUnique({
      where: { id: contactId }
    });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const data = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({ error: 'Email cannot be empty.' });
      }
      data.email = email.trim().toLowerCase();
    }

    try {
      await prisma.emailContact.update({
        where: { id: contactId },
        data
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email already exists.' });
      }
      throw error;
    }

    if (Array.isArray(groupIds)) {
      const uniqueGroupIds = [...new Set(groupIds)].filter(Boolean);

      await prisma.$transaction(async (tx) => {
        await tx.emailContactGroupMember.deleteMany({
          where: { contactId }
        });

        if (uniqueGroupIds.length) {
          const groups = await tx.emailContactGroup.findMany({
            where: {
              id: { in: uniqueGroupIds },
              userId: req.user.id
            }
          });

          await tx.emailContactGroupMember.createMany({
            data: groups.map((group) => ({
              groupId: group.id,
              contactId
            }))
          });
        }
      });
    }

    const updated = await prisma.emailContact.findUnique({
      where: { id: contactId },
      include: {
        groupLinks: {
          include: { group: true }
        }
      }
    });

    res.json({
      contact: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        groups: updated.groupLinks.map((link) => link.group)
      }
    });
  } catch (error) {
    console.error('updateEmailContact error:', error);
    res.status(500).json({ error: 'Failed to update contact.' });
  }
}

export async function deleteEmailContact(req, res) {
  try {
    const { contactId } = req.params;

    const contact = await prisma.emailContact.findUnique({
      where: { id: contactId }
    });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    await prisma.emailContact.delete({
      where: { id: contactId }
    });

    res.json({ message: 'Contact deleted.' });
  } catch (error) {
    console.error('deleteEmailContact error:', error);
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
}

export async function listEmailContactGroups(req, res) {
  try {
    const groups = await prisma.emailContactGroup.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: {
            contact: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        members: group.members.map((member) => member.contact)
      }))
    });
  } catch (error) {
    console.error('listEmailContactGroups error:', error);
    res.status(500).json({ error: 'Failed to load groups.' });
  }
}

export async function createEmailContactGroup(req, res) {
  try {
    const { name, contactIds = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const uniqueContactIds = [...new Set(contactIds)].filter(Boolean);

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.emailContactGroup.create({
        data: {
          userId: req.user.id,
          name: name.trim()
        }
      });

      if (uniqueContactIds.length) {
        const contacts = await tx.emailContact.findMany({
          where: {
            id: { in: uniqueContactIds },
            userId: req.user.id
          }
        });

        await tx.emailContactGroupMember.createMany({
          data: contacts.map((contact) => ({
            groupId: newGroup.id,
            contactId: contact.id
          }))
        });
      }

      return newGroup;
    });

    res.status(201).json({ group });
  } catch (error) {
    console.error('createEmailContactGroup error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Group name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create group.' });
  }
}

export async function updateEmailContactGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { name, contactIds } = req.body;

    const group = await prisma.emailContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Group name cannot be empty.' });
      }
      try {
        await prisma.emailContactGroup.update({
          where: { id: groupId },
          data: { name: name.trim() }
        });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(400).json({ error: 'Group name already exists.' });
        }
        throw error;
      }
    }

    if (Array.isArray(contactIds)) {
      const uniqueContactIds = [...new Set(contactIds)].filter(Boolean);
      await prisma.$transaction(async (tx) => {
        await tx.emailContactGroupMember.deleteMany({ where: { groupId } });

        if (uniqueContactIds.length) {
          const contacts = await tx.emailContact.findMany({
            where: {
              id: { in: uniqueContactIds },
              userId: req.user.id
            }
          });

          await tx.emailContactGroupMember.createMany({
            data: contacts.map((contact) => ({
              groupId,
              contactId: contact.id
            }))
          });
        }
      });
    }

    const updated = await prisma.emailContactGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { contact: true }
        }
      }
    });

    res.json({
      group: {
        id: updated.id,
        name: updated.name,
        members: updated.members.map((member) => member.contact)
      }
    });
  } catch (error) {
    console.error('updateEmailContactGroup error:', error);
    res.status(500).json({ error: 'Failed to update group.' });
  }
}

export async function deleteEmailContactGroup(req, res) {
  try {
    const { groupId } = req.params;

    const group = await prisma.emailContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    await prisma.emailContactGroup.delete({ where: { id: groupId } });

    res.json({ message: 'Group deleted.' });
  } catch (error) {
    console.error('deleteEmailContactGroup error:', error);
    res.status(500).json({ error: 'Failed to delete group.' });
  }
}

export async function addContactsToGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { contactIds = [] } = req.body;

    const group = await prisma.emailContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const uniqueContactIds = [...new Set(contactIds)].filter(Boolean);

    const contacts = await prisma.emailContact.findMany({
      where: {
        id: { in: uniqueContactIds },
        userId: req.user.id
      }
    });

    await prisma.emailContactGroupMember.createMany({
      data: contacts.map((contact) => ({
        groupId,
        contactId: contact.id
      })),
      skipDuplicates: true
    });

    res.json({ message: 'Contacts added to group.' });
  } catch (error) {
    console.error('addContactsToGroup error:', error);
    res.status(500).json({ error: 'Failed to add contacts.' });
  }
}

export async function removeContactFromGroup(req, res) {
  try {
    const { groupId, contactId } = req.params;

    const group = await prisma.emailContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    await prisma.emailContactGroupMember.deleteMany({
      where: {
        groupId,
        contactId
      }
    });

    res.json({ message: 'Contact removed from group.' });
  } catch (error) {
    console.error('removeContactFromGroup error:', error);
    res.status(500).json({ error: 'Failed to remove contact.' });
  }
}
