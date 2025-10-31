import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getIntegrationDefinitions,
  listIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration
} from '../controllers/userIntegrationController.js';
import {
  listEmailContacts,
  createEmailContact,
  updateEmailContact,
  deleteEmailContact,
  listEmailContactGroups,
  createEmailContactGroup,
  updateEmailContactGroup,
  deleteEmailContactGroup,
  addContactsToGroup,
  removeContactFromGroup
} from '../controllers/userEmailContactController.js';
import {
  listLineContacts,
  createLineContact,
  updateLineContact,
  deleteLineContact,
  listLineContactGroups,
  createLineContactGroup,
  updateLineContactGroup,
  deleteLineContactGroup,
  addLineContactsToGroup,
  removeLineContactFromGroup
} from '../controllers/userLineContactController.js';
import {
  sendUserMessage,
  listSentMessages,
  listNotifications,
  listRecipientUsers,
  listRecipientGroups
} from '../controllers/userMessageController.js';
import { getUserDashboard } from '../controllers/userDashboardController.js';
import { uploadAttachment } from '../config/upload.js';

const router = express.Router();

router.use(authenticateToken);

// Integrations
router.get('/integrations/definitions', getIntegrationDefinitions);
router.get('/integrations', listIntegrations);
router.post('/integrations', createIntegration);
router.patch('/integrations/:integrationId', updateIntegration);
router.delete('/integrations/:integrationId', deleteIntegration);

// Email contacts
router.get('/email/contacts', listEmailContacts);
router.post('/email/contacts', createEmailContact);
router.patch('/email/contacts/:contactId', updateEmailContact);
router.delete('/email/contacts/:contactId', deleteEmailContact);

router.get('/email/groups', listEmailContactGroups);
router.post('/email/groups', createEmailContactGroup);
router.patch('/email/groups/:groupId', updateEmailContactGroup);
router.delete('/email/groups/:groupId', deleteEmailContactGroup);
router.post('/email/groups/:groupId/contacts', addContactsToGroup);
router.delete('/email/groups/:groupId/contacts/:contactId', removeContactFromGroup);

// LINE contacts
router.get('/line/contacts', listLineContacts);
router.post('/line/contacts', createLineContact);
router.patch('/line/contacts/:contactId', updateLineContact);
router.delete('/line/contacts/:contactId', deleteLineContact);

router.get('/line/groups', listLineContactGroups);
router.post('/line/groups', createLineContactGroup);
router.patch('/line/groups/:groupId', updateLineContactGroup);
router.delete('/line/groups/:groupId', deleteLineContactGroup);
router.post('/line/groups/:groupId/contacts', addLineContactsToGroup);
router.delete('/line/groups/:groupId/contacts/:contactId', removeLineContactFromGroup);

// Messaging
router.post('/messages/send', (req, res, next) => {
  const handler = uploadAttachment.array('attachments', 5);
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return sendUserMessage(req, res, next);
  });
});
router.get('/messages/sent', listSentMessages);

// Notifications
router.get('/notifications', listNotifications);

// Recipients
router.get('/recipients/users', listRecipientUsers);
router.get('/recipients/groups', listRecipientGroups);

// Dashboard
router.get('/dashboard', getUserDashboard);

export default router;
