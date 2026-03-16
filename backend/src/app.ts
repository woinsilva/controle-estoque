import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import type { NextFunction, Request, Response } from 'express';
import { env } from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import { authMiddleware } from './middlewares/auth.js';
import { requireRole } from './middlewares/role.js';
import productRoutes from './modules/products/routes.js';
import salesRoutes from './modules/sales/routes.js';
import usersRoutes from './modules/users/routes.js';
import clientsRoutes from './modules/clients/routes.js';
import questionnairesRoutes from './modules/questionnaires/routes.js';
import appointmentsRoutes from './modules/appointments/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import reportsRoutes from './modules/reports/routes.js';
import servicesRoutes from './modules/services/routes.js';
import schedulesRoutes from './modules/schedules/routes.js';
import { logger } from './config/logger.js';

export const app = express();

const localOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(:\d+)?$/;
const allowedOrigins = new Set(env.corsOrigins);

app.set('trust proxy', 1);
app.use(
  (pinoHttp as unknown as (options: {
    logger: typeof logger;
    customLogLevel: (_req: Request, res: Response, err?: Error) => 'info' | 'warn' | 'error' | 'silent';
    autoLogging: { ignore: (req: Request) => boolean };
  }) => express.RequestHandler)({
    logger,
    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    autoLogging: {
      ignore(req) {
        return req.url === '/health';
      }
    }
  })
);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || (env.nodeEnv !== 'production' && localOriginPattern.test(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed.'));
    }
  })
);
app.use(express.json({ limit: '200kb' }));
app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(apiLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/users', usersRoutes);
app.use('/clients', clientsRoutes);
app.use('/questionnaires', questionnairesRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportsRoutes);
app.use('/services', servicesRoutes);
app.use('/schedules', schedulesRoutes);

app.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/admin/health', authMiddleware, requireRole(['ADMIN']), (_req, res) => {
  res.status(200).json({ status: 'ok', scope: 'admin' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, 'Unhandled request error.');
  res.status(500).json({ error: 'Internal server error.' });
});
