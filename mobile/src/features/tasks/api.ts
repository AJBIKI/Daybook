import { z } from 'zod';

import { apiClient } from '../../lib/apiClient';
import type {
  ApiPaginatedSuccess,
  ApiSuccess,
  PaginationMeta,
} from '../../types/api';
import type {
  Task,
  TaskListFilters,
  TaskPriority,
  TaskSummary,
} from '../../types/task';

export interface CreateTaskInput {
  title: string;
  notes?: string;
  priority: TaskPriority;
  dueDate: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  completed?: boolean;
}

export interface TaskListPage {
  tasks: Task[];
  meta: PaginationMeta;
}

const taskPrioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const taskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  notes: z.string(),
  priority: taskPrioritySchema,
  dueDate: z.string().nullable(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasNextPage: z.boolean(),
});

const taskSummarySchema = z.object({
  today: z.object({
    total: z.number(),
    completed: z.number(),
  }),
  overdue: z.number(),
  upcoming: z.number(),
});

function buildListQueryParams(
  filters: TaskListFilters,
  page: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page,
    limit: filters.limit ?? 20,
  };

  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.priority !== undefined) {
    params.priority = String(filters.priority);
  }
  if (filters.dueFrom) {
    params.dueFrom = filters.dueFrom;
  }
  if (filters.dueTo) {
    params.dueTo = filters.dueTo;
  }
  if (filters.q && filters.q.trim().length > 0) {
    params.q = filters.q.trim();
  }
  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters.order) {
    params.order = filters.order;
  }

  return params;
}

export async function listTasksRequest(
  filters: TaskListFilters,
  page = 1,
): Promise<TaskListPage> {
  const res = await apiClient.get<ApiPaginatedSuccess<Task>>('/tasks', {
    params: buildListQueryParams(filters, page),
  });
  return {
    tasks: z.array(taskSchema).parse(res.data.data),
    meta: paginationMetaSchema.parse(res.data.meta),
  };
}

export async function getTaskSummaryRequest(
  dueFrom: string,
  dueTo: string,
): Promise<TaskSummary> {
  const res = await apiClient.get<ApiSuccess<TaskSummary>>('/tasks/summary', {
    params: { dueFrom, dueTo },
  });
  return taskSummarySchema.parse(res.data.data);
}

export async function getTaskRequest(id: string): Promise<Task> {
  const res = await apiClient.get<ApiSuccess<Task>>(`/tasks/${id}`);
  return taskSchema.parse(res.data.data);
}

export async function createTaskRequest(input: CreateTaskInput): Promise<Task> {
  const res = await apiClient.post<ApiSuccess<Task>>('/tasks', input);
  return taskSchema.parse(res.data.data);
}

export async function updateTaskRequest(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const res = await apiClient.patch<ApiSuccess<Task>>(`/tasks/${id}`, input);
  return taskSchema.parse(res.data.data);
}

export async function deleteTaskRequest(id: string): Promise<{ id: string }> {
  const res = await apiClient.delete<ApiSuccess<{ id: string }>>(
    `/tasks/${id}`,
  );
  return z.object({ id: z.string() }).parse(res.data.data);
}
