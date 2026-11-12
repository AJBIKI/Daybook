import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { createAuthRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import {
  loginController,
  meController,
  registerController,
} from './controller.js';
import { loginBodySchema, registerBodySchema } from './schema.js';

export function createAuthRouter(): Router {
  const router = Router();
  const authRateLimiter = createAuthRateLimiter();

  router.use(authRateLimiter);

  router.post(
    '/register',
    validate({ body: registerBodySchema }),
    registerController,
  );
  router.post('/login', validate({ body: loginBodySchema }), loginController);
  router.get('/me', requireAuth, meController);

  return router;
}
