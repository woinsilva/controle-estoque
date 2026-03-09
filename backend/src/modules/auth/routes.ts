import { Router } from 'express';
import { activateClientController, loginController } from './controller.js';
import { validateBody } from '../../middlewares/validate.js';
import { activateClientSchema, loginSchema } from './validators.js';

const router = Router();

router.post('/login', validateBody(loginSchema), loginController);
router.post('/activate-client', validateBody(activateClientSchema), activateClientController);

export default router;
