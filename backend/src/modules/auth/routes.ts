import { Router } from 'express';
import { loginController } from './controller.js';
import { validateBody } from '../../middlewares/validate.js';
import { loginSchema } from './validators.js';

const router = Router();

router.post('/login', validateBody(loginSchema), loginController);

export default router;
