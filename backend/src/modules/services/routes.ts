import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import {
  createServiceController,
  deleteServiceController,
  getServiceController,
  listServicesController,
  updateServiceController
} from './controller.js';
import { serviceIdParamSchema, serviceSchema, updateServiceSchema } from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']), listServicesController);
router.get(
  '/:id',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']),
  validateParams(serviceIdParamSchema),
  getServiceController
);
router.post(
  '/',
  requireRole(['MANAGER', 'ADMIN']),
  validateBody(serviceSchema),
  createServiceController
);
router.put(
  '/:id',
  requireRole(['MANAGER', 'ADMIN']),
  validateParams(serviceIdParamSchema),
  validateBody(updateServiceSchema),
  updateServiceController
);
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  validateParams(serviceIdParamSchema),
  deleteServiceController
);

export default router;
