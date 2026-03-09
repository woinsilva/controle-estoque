import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';
import {
  createClientController,
  deleteClientController,
  getClientController,
  listClientsController,
  updateClientController
} from './controller.js';
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema
} from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateQuery(listClientsQuerySchema),
  listClientsController
);
router.get(
  '/:id',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(clientIdParamSchema),
  getClientController
);
router.post(
  '/',
  requireRole(['MANAGER', 'ADMIN']),
  validateBody(createClientSchema),
  createClientController
);
router.put(
  '/:id',
  requireRole(['MANAGER', 'ADMIN']),
  validateParams(clientIdParamSchema),
  validateBody(updateClientSchema),
  updateClientController
);
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  validateParams(clientIdParamSchema),
  deleteClientController
);

export default router;
