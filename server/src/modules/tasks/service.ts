import mongoose, { type PipelineStage } from 'mongoose';

import { AppError } from '../../utils/AppError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import {
  TaskModel,
  toPublicTask,
  type PublicTask,
  type TaskAggregateRow,
} from './model.js';
import type {
  CreateTaskBody,
  ListTasksQuery,
  SummaryQuery,
  UpdateTaskBody,
} from './schema.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface TaskListResult {
  tasks: PublicTask[];
  meta: PaginationMeta;
}

export interface TaskSummaryResult {
  today: {
    total: number;
    completed: number;
  };
  overdue: number;
  upcoming: number;
}

type TaskFilter = Record<string, unknown>;

function buildTaskListFilter(
  userId: string,
  query: ListTasksQuery,
): TaskFilter {
  const filter: TaskFilter = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (query.status === 'active') {
    filter['completed'] = false;
  } else if (query.status === 'completed') {
    filter['completed'] = true;
  }

  if (query.priority !== undefined) {
    filter['priority'] = query.priority;
  }

  if (query.dueFrom !== undefined || query.dueTo !== undefined) {
    const dueRange: Record<string, Date> = {};
    if (query.dueFrom !== undefined) {
      dueRange['$gte'] = new Date(query.dueFrom);
    }
    if (query.dueTo !== undefined) {
      dueRange['$lte'] = new Date(query.dueTo);
    }
    filter['dueDate'] = dueRange;
  }

  if (query.q !== undefined) {
    const regex = new RegExp(escapeRegex(query.q), 'i');
    filter['$or'] = [{ title: regex }, { notes: regex }];
  }

  return filter;
}

export async function listTasks(
  userId: string,
  query: ListTasksQuery,
): Promise<TaskListResult> {
  const filter = buildTaskListFilter(userId, query);
  const sortDir: 1 | -1 = query.order === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const findPromise =
    query.sortBy === 'dueDate'
      ? runDueDateNullsLastQuery(filter, sortDir, skip, query.limit)
      : TaskModel.find(filter)
          .sort({ [query.sortBy]: sortDir, _id: sortDir })
          .skip(skip)
          .limit(query.limit)
          .then((docs) => docs.map(toPublicTask));

  const countPromise = TaskModel.countDocuments(filter);

  const [tasks, total] = await Promise.all([findPromise, countPromise]);

  return {
    tasks,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      hasNextPage: skip + tasks.length < total,
    },
  };
}

async function runDueDateNullsLastQuery(
  filter: TaskFilter,
  sortDir: 1 | -1,
  skip: number,
  limit: number,
): Promise<PublicTask[]> {
  const pipeline: PipelineStage[] = [
    { $match: filter },
    {
      $addFields: {
        hasDueDate: {
          $cond: [{ $eq: ['$dueDate', null] }, 1, 0],
        },
      },
    },
    { $sort: { hasDueDate: 1, dueDate: sortDir, _id: sortDir } },
    { $skip: skip },
    { $limit: limit },
    { $unset: 'hasDueDate' },
  ];

  const rows = await TaskModel.aggregate<TaskAggregateRow>(pipeline);
  return rows.map(toPublicTask);
}

export async function getTaskSummary(
  userId: string,
  query: SummaryQuery,
): Promise<TaskSummaryResult> {
  const ownerId = new mongoose.Types.ObjectId(userId);
  const startOfDay = new Date(query.dueFrom);
  const endOfDay = new Date(query.dueTo);

  const [todayTotal, todayCompleted, overdue, upcoming] = await Promise.all([
    TaskModel.countDocuments({
      userId: ownerId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    }),
    TaskModel.countDocuments({
      userId: ownerId,
      completed: true,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    }),
    TaskModel.countDocuments({
      userId: ownerId,
      completed: false,
      dueDate: { $ne: null, $lt: startOfDay },
    }),
    TaskModel.countDocuments({
      userId: ownerId,
      completed: false,
      dueDate: { $gt: endOfDay },
    }),
  ]);

  return {
    today: {
      total: todayTotal,
      completed: todayCompleted,
    },
    overdue,
    upcoming,
  };
}

export async function createTask(
  userId: string,
  input: CreateTaskBody,
): Promise<PublicTask> {
  const task = await TaskModel.create({
    userId: new mongoose.Types.ObjectId(userId),
    title: input.title,
    notes: input.notes,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    completed: false,
    completedAt: null,
  });

  return toPublicTask(task);
}

export async function getTaskById(
  userId: string,
  taskId: string,
): Promise<PublicTask> {
  const task = await TaskModel.findOne({ _id: taskId, userId });
  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }
  return toPublicTask(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskBody,
): Promise<PublicTask> {
  const updateFields: Record<string, unknown> = {};

  if (input.title !== undefined) {
    updateFields['title'] = input.title;
  }
  if (input.notes !== undefined) {
    updateFields['notes'] = input.notes;
  }
  if (input.priority !== undefined) {
    updateFields['priority'] = input.priority;
  }
  if (input.dueDate !== undefined) {
    updateFields['dueDate'] = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.completed !== undefined) {
    updateFields['completed'] = input.completed;
    updateFields['completedAt'] = input.completed ? new Date() : null;
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true },
  );

  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  return toPublicTask(task);
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<{ id: string }> {
  const task = await TaskModel.findOneAndDelete({ _id: taskId, userId });
  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  return { id: task._id.toString() };
}
