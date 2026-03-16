import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.logLevel,
  base: { service: 'controle-estoque-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.confirmPassword',
      'res.headers["set-cookie"]'
    ],
    censor: '[REDACTED]'
  }
});
