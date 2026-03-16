import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const port = Number(process.env.PORT || 3000);
const mongodbUri = process.env.MONGODB_URI || '';
const jwtSecret = process.env.JWT_SECRET || '';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
const frontendAppUrl = process.env.FRONTEND_APP_URL || 'http://localhost:5173';
const corsOriginRaw = process.env.CORS_ORIGIN || frontendAppUrl;
const corsOrigins = corsOriginRaw
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const logLevel = process.env.LOG_LEVEL || 'info';
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || '';
const smtpSecure = process.env.SMTP_SECURE === 'true';

if (!mongodbUri) {
  throw new Error('MONGODB_URI is required');
}
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

export const env = {
  nodeEnv,
  port,
  mongodbUri,
  jwtSecret,
  jwtExpiresIn,
  frontendAppUrl,
  corsOrigins,
  logLevel,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  smtpFrom,
  smtpSecure
};
