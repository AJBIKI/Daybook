import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  summaryController,
  updateTaskController,
} from './controller.js';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  summaryQuerySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
} from './schema.js';

export function createTasksRouter(): Router {
  const router = Router();

  router.use(requireAuth);

  // Declare /summary before /:id so Express does not treat "summary" as a task id.
  router.get(
    '/summary',
    validate({ query: summaryQuerySchema }),
    summaryController,
  );
  router.get('/', validate({ query: listTasksQuerySchema }), listTasksController);
  router.post('/', validate({ body: createTaskBodySchema }), createTaskController);
  router.get(
    '/:id',
    validate({ params: taskIdParamsSchema }),
    getTaskController,
  );
  router.patch(
    '/:id',
    validate({ params: taskIdParamsSchema, body: updateTaskBodySchema }),
    updateTaskController,
  );
  router.delete(
    '/:id',
    validate({ params: taskIdParamsSchema }),
    deleteTaskController,
  );

  return router;
}
