import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import {
  createResponseController,
  createTemplateController,
  getResponseController,
  listResponsesByAppointmentController,
  listResponsesByClientController,
  listTemplatesController,
  publishTemplateController,
  updateTemplateController
} from './controller.js';
import {
  appointmentIdParamSchema,
  questionnaireResponseSchema,
  questionnaireTemplateSchema
} from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/templates', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), listTemplatesController);
router.post(
  '/templates',
  requireRole(['MANAGER', 'ADMIN']),
  validateBody(questionnaireTemplateSchema),
  createTemplateController
);
router.put(
  '/templates/:id',
  requireRole(['MANAGER', 'ADMIN']),
  validateBody(questionnaireTemplateSchema),
  updateTemplateController
);
router.post('/templates/:id/publish', requireRole(['MANAGER', 'ADMIN']), publishTemplateController);

router.get(
  '/responses/client/:clientId',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  listResponsesByClientController
);
router.get(
  '/responses/appointment/:appointmentId',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(appointmentIdParamSchema),
  listResponsesByAppointmentController
);
router.get('/responses/:id', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), getResponseController);
router.post(
  '/responses',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateBody(questionnaireResponseSchema),
  createResponseController
);

export default router;
