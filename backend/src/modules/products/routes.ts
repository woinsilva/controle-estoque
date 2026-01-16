import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  createProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  updateProductController
} from './controller.js';
import { productSchema } from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), listProductsController);
router.get('/:id', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), getProductController);
router.post('/', requireRole(['MANAGER', 'ADMIN']), validateBody(productSchema), createProductController);
router.put('/:id', requireRole(['MANAGER', 'ADMIN']), validateBody(productSchema), updateProductController);
router.delete('/:id', requireRole(['ADMIN']), deleteProductController);

export default router;
