import nodemailer from 'nodemailer';

const transporterCache = new Map();

const buildCacheKey = (integrationId, credentials) =>
  `${integrationId}:${credentials.smtpHost}:${credentials.smtpPort}:${credentials.smtpUser}`;

export function getEmailTransporter(integrationId, credentials, config = {}) {
  const cacheKey = buildCacheKey(integrationId, credentials);
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }

  const port = Number(credentials.smtpPort) || 587;
  const secure = config.useTLS ?? port === 465;

  const transporter = nodemailer.createTransport({
    host: credentials.smtpHost,
    port,
    secure,
    auth: {
      user: credentials.smtpUser,
      pass: credentials.smtpPassword
    }
  });

  transporterCache.set(cacheKey, transporter);
  return transporter;
}

export function clearEmailTransporterCache(integrationId) {
  for (const key of transporterCache.keys()) {
    if (key.startsWith(`${integrationId}:`)) {
      transporterCache.delete(key);
    }
  }
}
