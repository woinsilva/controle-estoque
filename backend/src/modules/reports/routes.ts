import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { getReportsSummaryController } from './controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/summary', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), getReportsSummaryController);

export default router;
