import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleAuth.js';

import {
  executeSqlQuery,
  getQueryHistory,
  updateQueryHistoryVisibility
} from '../controllers/adminSqlController.js';
import {
  fetchPreferences,
  updatePreference
} from '../controllers/adminPreferenceController.js';
import {
  listUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser
} from '../controllers/adminUserController.js';
import {
  getMessageLogs,
  sendManualMessageHandler,
  logInboundMessageHandler,
  listChatThreads,
  getChatMessages,
  sendChatMessage
} from '../controllers/adminMessagingController.js';
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupMembers,
  removeGroupMember
} from '../controllers/adminGroupController.js';
import {
  createSchedule,
  listSchedules,
  rescheduleMessage,
  cancelSchedule,
  triggerSchedulerNow
} from '../controllers/adminScheduleController.js';
import {
  listAdminCodes,
  createAdminCode,
  deactivateAdminCode,
  deleteAdminCode
} from '../controllers/adminCodeController.js';
import { getDashboardMetrics } from '../controllers/adminDashboardController.js';
import {
  exportMessageLogs,
  exportQueryHistory
} from '../controllers/adminExportController.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// SQL console
router.post('/sql/execute', executeSqlQuery);
router.get('/sql/history', getQueryHistory);
router.patch('/sql/history/:historyId/visibility', updateQueryHistoryVisibility);

// Preferences
router.get('/preferences', fetchPreferences);
router.put('/preferences', updatePreference);

// Users
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:userId', updateUser);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Messaging & chat
router.get('/messages/logs', getMessageLogs);
router.post('/messages/manual', sendManualMessageHandler);
router.post('/messages/inbound', logInboundMessageHandler);
router.get('/chat/threads', listChatThreads);
router.get('/chat/:userId/messages', getChatMessages);
router.post('/chat/:userId/messages', sendChatMessage);

// Groups
router.get('/groups', listGroups);
router.post('/groups', createGroup);
router.patch('/groups/:groupId', updateGroup);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/members', addGroupMembers);
router.delete('/groups/:groupId/members/:userId', removeGroupMember);

// Scheduling
router.post('/schedules', createSchedule);
router.get('/schedules', listSchedules);
router.patch('/schedules/:scheduleId', rescheduleMessage);
router.post('/schedules/:scheduleId/cancel', cancelSchedule);
router.post('/schedules/run-now', triggerSchedulerNow);

// Admin codes
router.get('/codes', listAdminCodes);
router.post('/codes', createAdminCode);
router.post('/codes/:codeId/deactivate', deactivateAdminCode);
router.delete('/codes/:codeId', deleteAdminCode);

// Dashboard
router.get('/dashboard/metrics', getDashboardMetrics);

// Exports
router.get('/exports/query-history', exportQueryHistory);
router.get('/exports/message-logs', exportMessageLogs);

export default router;
