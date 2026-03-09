import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { getScheduleController, listSchedulesController, upsertScheduleController } from './controller.js';
import { professionalIdParamSchema, scheduleSchema } from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), listSchedulesController);
router.get(
  '/:professionalId',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT']),
  validateParams(professionalIdParamSchema),
  getScheduleController
);
router.put(
  '/:professionalId',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(professionalIdParamSchema),
  validateBody(scheduleSchema),
  upsertScheduleController
);

export default router;
