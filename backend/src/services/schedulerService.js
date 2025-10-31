const DEFAULT_INTERVAL_MS = 60_000;

let intervalHandle = null;

export function startScheduler(processor) {
  if (intervalHandle) {
    return;
  }

  const intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  const safeInterval = Number.isNaN(intervalMs) ? DEFAULT_INTERVAL_MS : Math.max(intervalMs, 5000);

  intervalHandle = setInterval(async () => {
    try {
      await processor();
    } catch (error) {
      console.error('Scheduler processor error:', error);
    }
  }, safeInterval);

  console.log(`🕒 Scheduler started (interval ${safeInterval} ms).`);
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
