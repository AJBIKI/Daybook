import type { Request, Response } from 'express';

import { getAuthUserId } from '../../middleware/auth.js';
import { getValidated } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type {
  CreateTaskBody,
  ListTasksQuery,
  SummaryQuery,
  TaskIdParams,
  UpdateTaskBody,
} from './schema.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskSummary,
  listTasks,
  updateTask,
} from './service.js';

export const listTasksController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { query } = getValidated<unknown, ListTasksQuery>(res);
    const result = await listTasks(userId, query);
    res.status(200).json({
      data: result.tasks,
      meta: result.meta,
    });
  },
);

export const summaryController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { query } = getValidated<unknown, SummaryQuery>(res);
    const summary = await getTaskSummary(userId, query);
    res.status(200).json({ data: summary });
  },
);

export const createTaskController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { body } = getValidated<CreateTaskBody>(res);
    const task = await createTask(userId, body);
    res.status(201).json({ data: task });
  },
);

export const getTaskController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { params } = getValidated<unknown, unknown, TaskIdParams>(res);
    const task = await getTaskById(userId, params.id);
    res.status(200).json({ data: task });
  },
);

export const updateTaskController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { body, params } = getValidated<UpdateTaskBody, unknown, TaskIdParams>(
      res,
    );
    const task = await updateTask(userId, params.id, body);
    res.status(200).json({ data: task });
  },
);

export const deleteTaskController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const { params } = getValidated<unknown, unknown, TaskIdParams>(res);
    const deleted = await deleteTask(userId, params.id);
    res.status(200).json({ data: deleted });
  },
);
