import mongoose from 'mongoose';
import { z } from 'zod';

const isoDatetimeSchema = z.iso.datetime({
  offset: true,
  message: 'Must be a valid ISO-8601 datetime with timezone offset',
});

const prioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const taskIdParamsSchema = z.object({
  id: z.string().refine((val) => mongoose.isValidObjectId(val), {
    message: 'Invalid task id',
  }),
});

export const createTaskBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .default(''),
  priority: prioritySchema.optional().default(2),
  dueDate: isoDatetimeSchema.nullable().optional().default(null),
});

export const updateTaskBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Title must be at most 120 characters')
      .optional(),
    notes: z
      .string()
      .max(2000, 'Notes must be at most 2000 characters')
      .optional(),
    priority: prioritySchema.optional(),
    dueDate: isoDatetimeSchema.nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listTasksQuerySchema = z
  .object({
    status: z.enum(['all', 'active', 'completed']).optional().default('all'),
    priority: z
      .enum(['1', '2', '3'])
      .transform((val) => Number(val) as 1 | 2 | 3)
      .optional(),
    dueFrom: isoDatetimeSchema.optional(),
    dueTo: isoDatetimeSchema.optional(),
    q: z
      .string()
      .trim()
      .max(100, 'Search query must be at most 100 characters')
      .transform((val) => (val.length === 0 ? undefined : val))
      .optional(),
    sortBy: z
      .enum(['dueDate', 'priority', 'createdAt'])
      .optional()
      .default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  })
  .refine(
    (data) =>
      !data.dueFrom ||
      !data.dueTo ||
      new Date(data.dueFrom) <= new Date(data.dueTo),
    {
      message: 'dueFrom must be before or equal to dueTo',
      path: ['dueFrom'],
    },
  );

export const summaryQuerySchema = z
  .object({
    dueFrom: isoDatetimeSchema,
    dueTo: isoDatetimeSchema,
  })
  .refine((data) => new Date(data.dueFrom) <= new Date(data.dueTo), {
    message: 'dueFrom must be before or equal to dueTo',
    path: ['dueFrom'],
  });

export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
