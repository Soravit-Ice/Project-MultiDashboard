import prisma from '../config/database.js';

const baseContactInclude = {
  integration: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  groupLinks: {
    include: {
      group: {
        select: { id: true, name: true }
      }
    }
  }
};

export async function listLineContacts(req, res) {
  try {
    const contacts = await prisma.lineContact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: baseContactInclude
    });

    res.json({
      contacts: contacts.map((contact) => ({
        id: contact.id,
        lineUserId: contact.lineUserId,
        displayName: contact.displayName,
        pictureUrl: contact.pictureUrl,
        integration: contact.integration,
        groups: contact.groupLinks.map((link) => link.group)
      }))
    });
  } catch (error) {
    console.error('listLineContacts error:', error);
    res.status(500).json({ error: 'Failed to load LINE contacts.' });
  }
}

export async function createLineContact(req, res) {
  try {
    const { integrationId, lineUserId, displayName } = req.body;

    if (!integrationId || !lineUserId) {
      return res.status(400).json({ error: 'integrationId and lineUserId are required.' });
    }

    const integration = await prisma.userIntegration.findFirst({
      where: {
        id: integrationId,
        userId: req.user.id,
        type: 'LINE'
      }
    });

    if (!integration) {
      return res.status(404).json({ error: 'LINE integration not found.' });
    }

    try {
      const contact = await prisma.lineContact.create({
        data: {
          userId: req.user.id,
          integrationId,
          lineUserId: lineUserId.trim(),
          displayName: displayName?.trim() || null
        },
        include: baseContactInclude
      });

      res.status(201).json({
        contact: {
          id: contact.id,
          lineUserId: contact.lineUserId,
          displayName: contact.displayName,
          integration: contact.integration,
          groups: []
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'LINE user already exists for this integration.' });
      }
      throw error;
    }
  } catch (error) {
    console.error('createLineContact error:', error);
    res.status(500).json({ error: 'Failed to create LINE contact.' });
  }
}

export async function updateLineContact(req, res) {
  try {
    const { contactId } = req.params;
    const { displayName } = req.body;

    const contact = await prisma.lineContact.findUnique({ where: { id: contactId } });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const updated = await prisma.lineContact.update({
      where: { id: contactId },
      data: {
        displayName: displayName !== undefined ? displayName?.trim() || null : contact.displayName
      },
      include: baseContactInclude
    });

    res.json({
      contact: {
        id: updated.id,
        lineUserId: updated.lineUserId,
        displayName: updated.displayName,
        integration: updated.integration,
        groups: updated.groupLinks.map((link) => link.group)
      }
    });
  } catch (error) {
    console.error('updateLineContact error:', error);
    res.status(500).json({ error: 'Failed to update LINE contact.' });
  }
}

export async function deleteLineContact(req, res) {
  try {
    const { contactId } = req.params;

    const contact = await prisma.lineContact.findUnique({ where: { id: contactId } });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    await prisma.lineContact.delete({ where: { id: contactId } });

    res.json({ message: 'LINE contact deleted.' });
  } catch (error) {
    console.error('deleteLineContact error:', error);
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
}

export async function listLineContactGroups(req, res) {
  try {
    const groups = await prisma.lineContactGroup.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: {
            contact: {
              select: {
                id: true,
                lineUserId: true,
                displayName: true,
                integrationId: true
              }
            }
          }
        }
      }
    });

    res.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        members: group.members.map((member) => member.contact)
      }))
    });
  } catch (error) {
    console.error('listLineContactGroups error:', error);
    res.status(500).json({ error: 'Failed to load LINE groups.' });
  }
}

export async function createLineContactGroup(req, res) {
  try {
    const { name, contactIds = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const uniqueContactIds = [...new Set(contactIds)].filter(Boolean);

    const group = await prisma.lineContactGroup.create({
      data: {
        userId: req.user.id,
        name: name.trim()
      }
    });

    if (uniqueContactIds.length) {
      const contacts = await prisma.lineContact.findMany({
        where: {
          id: { in: uniqueContactIds },
          userId: req.user.id
        }
      });

      await prisma.lineContactGroupMember.createMany({
        data: contacts.map((contact) => ({
          groupId: group.id,
          contactId: contact.id
        }))
      });
    }

    res.status(201).json({ group });
  } catch (error) {
    console.error('createLineContactGroup error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Group name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create LINE group.' });
  }
}

export async function updateLineContactGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { name, contactIds } = req.body;

    const group = await prisma.lineContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Group name cannot be empty.' });
      }
      try {
        await prisma.lineContactGroup.update({
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
      await prisma.lineContactGroupMember.deleteMany({ where: { groupId } });

      if (uniqueContactIds.length) {
        const contacts = await prisma.lineContact.findMany({
          where: {
            id: { in: uniqueContactIds },
            userId: req.user.id
          }
        });

        await prisma.lineContactGroupMember.createMany({
          data: contacts.map((contact) => ({
            groupId,
            contactId: contact.id
          }))
        });
      }
    }

    const updated = await prisma.lineContactGroup.findUnique({
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
    console.error('updateLineContactGroup error:', error);
    res.status(500).json({ error: 'Failed to update LINE group.' });
  }
}

export async function deleteLineContactGroup(req, res) {
  try {
    const { groupId } = req.params;

    const group = await prisma.lineContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    await prisma.lineContactGroup.delete({ where: { id: groupId } });

    res.json({ message: 'LINE group deleted.' });
  } catch (error) {
    console.error('deleteLineContactGroup error:', error);
    res.status(500).json({ error: 'Failed to delete LINE group.' });
  }
}

export async function addLineContactsToGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { contactIds = [] } = req.body;

    const group = await prisma.lineContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const uniqueContactIds = [...new Set(contactIds)].filter(Boolean);

    const contacts = await prisma.lineContact.findMany({
      where: {
        id: { in: uniqueContactIds },
        userId: req.user.id
      }
    });

    await prisma.lineContactGroupMember.createMany({
      data: contacts.map((contact) => ({
        groupId,
        contactId: contact.id
      })),
      skipDuplicates: true
    });

    res.json({ message: 'Contacts added to LINE group.' });
  } catch (error) {
    console.error('addLineContactsToGroup error:', error);
    res.status(500).json({ error: 'Failed to add contacts.' });
  }
}

export async function removeLineContactFromGroup(req, res) {
  try {
    const { groupId, contactId } = req.params;

    const group = await prisma.lineContactGroup.findUnique({ where: { id: groupId } });

    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    await prisma.lineContactGroupMember.deleteMany({
      where: {
        groupId,
        contactId
      }
    });

    res.json({ message: 'Contact removed from LINE group.' });
  } catch (error) {
    console.error('removeLineContactFromGroup error:', error);
    res.status(500).json({ error: 'Failed to remove contact.' });
  }
}
