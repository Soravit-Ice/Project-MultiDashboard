import app from './app.js';
import { processDueScheduledMessages } from './services/messageService.js';
import { startScheduler, stopScheduler } from './services/schedulerService.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.SCHEDULER_DISABLED !== 'true') {
    startScheduler(processDueScheduledMessages);
  } else {
    console.log('🕒 Scheduler disabled via SCHEDULER_DISABLED flag.');
  }
});

const shutdown = () => {
  stopScheduler();
  server.close(() => {
    console.log('👋 Server shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
