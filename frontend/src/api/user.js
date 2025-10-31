import api from './axios';

export const fetchUserDashboard = () => api.get('/user/dashboard').then((res) => res.data.metrics);

export const fetchIntegrationDefinitions = () =>
  api.get('/user/integrations/definitions').then((res) => res.data.definitions);

export const fetchUserIntegrations = () =>
  api.get('/user/integrations').then((res) => res.data.integrations);

export const createUserIntegration = (payload) =>
  api.post('/user/integrations', payload).then((res) => res.data.integration);

export const updateUserIntegration = (integrationId, payload) =>
  api.patch(`/user/integrations/${integrationId}`, payload).then((res) => res.data.integration);

export const deleteUserIntegration = (integrationId) =>
  api.delete(`/user/integrations/${integrationId}`).then((res) => res.data);

export const fetchEmailContacts = () =>
  api.get('/user/email/contacts').then((res) => res.data.contacts);

export const createEmailContact = (payload) =>
  api.post('/user/email/contacts', payload).then((res) => res.data.contact);

export const deleteEmailContact = (contactId) =>
  api.delete(`/user/email/contacts/${contactId}`).then((res) => res.data);

export const fetchEmailGroups = () =>
  api.get('/user/email/groups').then((res) => res.data.groups);

export const createEmailGroup = (payload) =>
  api.post('/user/email/groups', payload).then((res) => res.data.group);

export const deleteEmailGroup = (groupId) =>
  api.delete(`/user/email/groups/${groupId}`).then((res) => res.data);

export const fetchLineContacts = () =>
  api.get('/user/line/contacts').then((res) => res.data.contacts);

export const createLineContact = (payload) =>
  api.post('/user/line/contacts', payload).then((res) => res.data.contact);

export const deleteLineContact = (contactId) =>
  api.delete(`/user/line/contacts/${contactId}`).then((res) => res.data);

export const fetchLineGroups = () =>
  api.get('/user/line/groups').then((res) => res.data.groups);

export const createLineGroup = (payload) =>
  api.post('/user/line/groups', payload).then((res) => res.data.group);

export const deleteLineGroup = (groupId) =>
  api.delete(`/user/line/groups/${groupId}`).then((res) => res.data);

export const sendUserMessage = ({
  content,
  subject,
  userIds,
  groupIds,
  contactIds,
  contactGroupIds,
  lineContactIds,
  lineGroupIds,
  lineUserIds,
  emailAddresses,
  integrationIds,
  attachments = []
}) => {
  const formData = new FormData();
  formData.append('content', content);
  if (subject) {
    formData.append('subject', subject);
  }
  (userIds || []).forEach((userId) => formData.append('userIds', userId));
  (groupIds || []).forEach((groupId) => formData.append('groupIds', groupId));
  (contactIds || []).forEach((contactId) => formData.append('contactIds', contactId));
  (contactGroupIds || []).forEach((groupId) => formData.append('contactGroupIds', groupId));
  (lineContactIds || []).forEach((contactId) => formData.append('lineContactIds', contactId));
  (lineGroupIds || []).forEach((groupId) => formData.append('lineGroupIds', groupId));
  (lineUserIds || []).forEach((lineUserId) => formData.append('lineUserIds', lineUserId));
  (emailAddresses || []).forEach((email) => formData.append('emailAddresses', email));
  (integrationIds || []).forEach((integrationId) => formData.append('integrationIds', integrationId));
  attachments.forEach((file) => {
    formData.append('attachments', file.originFileObj || file);
  });

  return api
    .post('/user/messages/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((res) => res.data);
};

export const fetchSentMessages = (params) =>
  api.get('/user/messages/sent', { params }).then((res) => res.data.messages);

export const fetchNotifications = (params) =>
  api.get('/user/notifications', { params }).then((res) => res.data.notifications);

export const fetchRecipientUsers = (params) =>
  api.get('/user/recipients/users', { params }).then((res) => res.data.users);

export const fetchRecipientGroups = () =>
  api.get('/user/recipients/groups').then((res) => res.data.groups);
