import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody } from '../../middlewares/validate.js';
import { createSaleController, getSaleController, listSalesController } from './controller.js';
import { saleSchema } from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), listSalesController);
router.get('/:id', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), getSaleController);
router.post('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), validateBody(saleSchema), createSaleController);

export default router;
