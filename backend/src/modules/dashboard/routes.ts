import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { getDashboardSummaryController } from './controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/summary', requireRole(['MANAGER', 'ADMIN']), getDashboardSummaryController);

export default router;
