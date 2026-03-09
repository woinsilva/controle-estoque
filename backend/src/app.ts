import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import { connectDb } from './config/db.js';
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
import { logger } from './config/logger.js';

export const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
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

app.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/admin/health', authMiddleware, requireRole(['ADMIN']), (_req, res) => {
  res.status(200).json({ status: 'ok', scope: 'admin' });
});

// Initialize db connection on app import for simple startup flows.
void connectDb(env.mongodbUri);
