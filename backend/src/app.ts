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

app.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/admin/health', authMiddleware, requireRole(['ADMIN']), (_req, res) => {
  res.status(200).json({ status: 'ok', scope: 'admin' });
});

// Initialize db connection on app import for simple startup flows.
void connectDb(env.mongodbUri);
