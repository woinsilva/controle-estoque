import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';
import {
  getScheduleCalendarController,
  getScheduleController,
  listSchedulesController,
  upsertDateOverrideController,
  upsertScheduleController
} from './controller.js';
import {
  calendarQuerySchema,
  dateOverrideSchema,
  dateParamSchema,
  professionalIdParamSchema,
  scheduleSchema
} from './validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), listSchedulesController);
router.get('/:professionalId', requireRole(['OPERATOR', 'MANAGER', 'ADMIN']), validateParams(professionalIdParamSchema), getScheduleController);
router.get(
  '/:professionalId/calendar',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(professionalIdParamSchema),
  validateQuery(calendarQuerySchema),
  getScheduleCalendarController
);
router.put(
  '/:professionalId',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(professionalIdParamSchema),
  validateBody(scheduleSchema),
  upsertScheduleController
);
router.put(
  '/:professionalId/overrides/:date',
  requireRole(['OPERATOR', 'MANAGER', 'ADMIN']),
  validateParams(professionalIdParamSchema.merge(dateParamSchema)),
  validateBody(dateOverrideSchema),
  upsertDateOverrideController
);

export default router;
