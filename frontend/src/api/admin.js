import api from './axios';

// SQL console
export const executeSql = (payload) => api.post('/admin/sql/execute', payload).then((res) => res.data);
export const fetchSqlHistory = (params) => api.get('/admin/sql/history', { params }).then((res) => res.data);
export const updateSqlHistoryVisibility = ({ historyId, isVisible }) =>
  api.patch(`/admin/sql/history/${historyId}/visibility`, { isVisible }).then((res) => res.data);

// Preferences
export const fetchAdminPreferences = () => api.get('/admin/preferences').then((res) => res.data.preferences);
export const updateAdminPreference = (payload) => api.put('/admin/preferences', payload).then((res) => res.data.preference);

// Users
export const fetchUsers = () => api.get('/admin/users').then((res) => res.data.users);
export const createUser = (payload) => api.post('/admin/users', payload).then((res) => res.data.user);
export const updateUser = ({ userId, ...payload }) => api.patch(`/admin/users/${userId}`, payload).then((res) => res.data.user);
export const updateUserRole = ({ userId, role }) => api.patch(`/admin/users/${userId}/role`, { role }).then((res) => res.data.user);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`).then((res) => res.data);

// Messaging
export const fetchMessageLogs = (params) => api.get('/admin/messages/logs', { params }).then((res) => res.data.logs);
export const sendManualMessage = (payload) => api.post('/admin/messages/manual', payload).then((res) => res.data.result);
export const logInboundMessage = (payload) => api.post('/admin/messages/inbound', payload).then((res) => res.data.log);
export const fetchChatThreads = () => api.get('/admin/chat/threads').then((res) => res.data.threads);
export const fetchChatMessages = (userId, params) => api.get(`/admin/chat/${userId}/messages`, { params }).then((res) => res.data.messages);
export const sendChatMessage = (userId, payload) => api.post(`/admin/chat/${userId}/messages`, payload).then((res) => res.data.result);

// Groups
export const fetchGroups = () => api.get('/admin/groups').then((res) => res.data.groups);
export const createGroup = (payload) => api.post('/admin/groups', payload).then((res) => res.data.group);
export const updateGroup = ({ groupId, ...payload }) => api.patch(`/admin/groups/${groupId}`, payload).then((res) => res.data.group);
export const deleteGroup = (groupId) => api.delete(`/admin/groups/${groupId}`).then((res) => res.data);
export const addGroupMembers = ({ groupId, memberIds }) =>
  api.post(`/admin/groups/${groupId}/members`, { memberIds }).then((res) => res.data.group);
export const removeGroupMember = ({ groupId, userId }) =>
  api.delete(`/admin/groups/${groupId}/members/${userId}`).then((res) => res.data.group);

// Scheduling
export const fetchSchedules = (params) => api.get('/admin/schedules', { params }).then((res) => res.data.messages);
export const createSchedule = (payload) => api.post('/admin/schedules', payload).then((res) => res.data.scheduledMessage);
export const rescheduleMessage = ({ scheduleId, scheduleAt }) =>
  api.patch(`/admin/schedules/${scheduleId}`, { scheduleAt }).then((res) => res.data.scheduledMessage);
export const cancelSchedule = (scheduleId) => api.post(`/admin/schedules/${scheduleId}/cancel`).then((res) => res.data.scheduledMessage);
export const runSchedulerNow = () => api.post('/admin/schedules/run-now').then((res) => res.data);

// Admin codes
export const fetchAdminCodes = () => api.get('/admin/codes').then((res) => res.data.codes);
export const createAdminCode = (payload) => api.post('/admin/codes', payload).then((res) => res.data.code);
export const deactivateAdminCode = (codeId) => api.post(`/admin/codes/${codeId}/deactivate`).then((res) => res.data.code);
export const deleteAdminCode = (codeId) => api.delete(`/admin/codes/${codeId}`).then((res) => res.data);

// Dashboard
export const fetchDashboardMetrics = () => api.get('/admin/dashboard/metrics').then((res) => res.data.metrics);

// Export helpers
const downloadBlob = async (url, filename, params = {}, responseType = 'blob') => {
  const response = await api.get(url, {
    params,
    responseType
  });

  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportQueryHistory = (format = 'excel') =>
  downloadBlob('/admin/exports/query-history', `query-history.${format === 'pdf' ? 'pdf' : 'xlsx'}`, { format });

export const exportMessageLogs = (format = 'excel') =>
  downloadBlob('/admin/exports/message-logs', `message-logs.${format === 'pdf' ? 'pdf' : 'xlsx'}`, { format });
