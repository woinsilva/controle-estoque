import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';
import {
  createAppointmentController,
  deleteAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  updateAppointmentController,
  updateAppointmentStatusController
} from './controller.js';
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema
} from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']),
  validateQuery(listAppointmentsQuerySchema),
  listAppointmentsController
);
router.get(
  '/:id',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']),
  validateParams(appointmentIdParamSchema),
  getAppointmentController
);
router.post(
  '/',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']),
  validateBody(createAppointmentSchema),
  createAppointmentController
);
router.put(
  '/:id',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(appointmentIdParamSchema),
  validateBody(updateAppointmentSchema),
  updateAppointmentController
);
router.patch(
  '/:id/status',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(appointmentIdParamSchema),
  validateBody(updateAppointmentStatusSchema),
  updateAppointmentStatusController
);
router.delete(
  '/:id',
  requireRole(['MANAGER', 'ADMIN']),
  validateParams(appointmentIdParamSchema),
  deleteAppointmentController
);

export default router;
