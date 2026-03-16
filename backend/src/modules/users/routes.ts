import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/role.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  createUserController,
  deleteUserController,
  getCurrentUserController,
  getUserController,
  listProfessionalsController,
  listUsersController,
  updateOwnProfileController,
  updatePreferencesController,
  updateUserController
} from './controller.js';
import { createUserSchema, preferencesSchema, profileSchema, updateUserSchema } from './validators.js';

const router = Router();

router.use(authMiddleware);

router.patch('/me/preferences', validateBody(preferencesSchema), updatePreferencesController);
router.get('/me', getCurrentUserController);
router.patch('/me', validateBody(profileSchema), updateOwnProfileController);
router.get('/professionals', listProfessionalsController);

router.use(requireRole(['ADMIN']));

router.get('/', listUsersController);
router.get('/:id', getUserController);
router.post('/', validateBody(createUserSchema), createUserController);
router.put('/:id', validateBody(updateUserSchema), updateUserController);
router.delete('/:id', deleteUserController);

export default router;
