import type { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { TaskModel } from '../modules/tasks/model.js';
import { UserModel } from '../modules/users/model.js';

interface TaskDto {
  id: string;
  userId: string;
  title: string;
  notes: string;
  priority: 1 | 2 | 3;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  data: {
    user: { id: string; email: string };
    token: string;
  };
}

interface TaskResponse {
  data: TaskDto;
}

interface TaskListResponse {
  data: TaskDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

interface SummaryResponse {
  data: {
    today: { total: number; completed: number };
    overdue: number;
    upcoming: number;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

async function registerAndGetToken(
  app: Express,
  email: string,
  name: string,
): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send({
    name,
    email,
    password: 'Password123!',
  });
  expect(res.status).toBe(201);
  return (res.body as AuthResponse).data.token;
}

describe('Tasks API', () => {
  let mongoServer: MongoMemoryServer;
  let app: Express;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([TaskModel.deleteMany({}), UserModel.deleteMany({})]);
    app = createApp();
    tokenA = await registerAndGetToken(app, 'usera@example.com', 'User A');
    tokenB = await registerAndGetToken(app, 'userb@example.com', 'User B');
  });

  it('rejects unauthenticated task requests with 401 UNAUTHORIZED', async () => {
    const listRes = await request(app).get('/api/v1/tasks');
    expect(listRes.status).toBe(401);

    const summaryRes = await request(app).get(
      '/api/v1/tasks/summary?dueFrom=2026-11-12T00:00:00.000Z&dueTo=2026-11-12T23:59:59.999Z',
    );
    expect(summaryRes.status).toBe(401);
  });

  it('validates task creation inputs and rejects invalid ObjectIds', async () => {
    const badCreate = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: '   ',
        priority: 9,
        dueDate: 'not-a-date',
      });
    expect(badCreate.status).toBe(400);
    expect((badCreate.body as ErrorResponse).error.code).toBe(
      'VALIDATION_ERROR',
    );

    const badId = await request(app)
      .get('/api/v1/tasks/not-an-object-id')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(badId.status).toBe(400);
    expect((badId.body as ErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('enforces strict user isolation across read, update, delete, list, and summary', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'User B secret task',
        dueDate: '2026-11-12T10:00:00.000Z',
      });
    expect(createRes.status).toBe(201);
    const taskId = (createRes.body as TaskResponse).data.id;

    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Hijacked' });
    expect(patchRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delRes.status).toBe(404);

    const listRes = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(listRes.status).toBe(200);
    expect((listRes.body as TaskListResponse).data).toHaveLength(0);
  });

  it('creates, updates, sets/clears completedAt, and hard-deletes a task', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Write interview notes' });
    expect(created.status).toBe(201);
    const task = (created.body as TaskResponse).data;
    expect(task.priority).toBe(2);
    expect(task.notes).toBe('');
    expect(task.dueDate).toBeNull();
    expect(task.completed).toBe(false);
    expect(task.completedAt).toBeNull();

    const doneRes = await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true });
    expect(doneRes.status).toBe(200);
    const doneTask = (doneRes.body as TaskResponse).data;
    expect(doneTask.completed).toBe(true);
    expect(doneTask.completedAt).not.toBeNull();

    const undoneRes = await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: false });
    expect(undoneRes.status).toBe(200);
    const undoneTask = (undoneRes.body as TaskResponse).data;
    expect(undoneTask.completed).toBe(false);
    expect(undoneTask.completedAt).toBeNull();

    const delRes = await request(app)
      .delete(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delRes.status).toBe(200);

    const afterDel = await request(app)
      .get(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(afterDel.status).toBe(404);
  });

  it('filters by status, priority, due range, and escaped regex search query', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Review C++ (core) [v1]',
        notes: 'Check pointers',
        priority: 3,
        dueDate: '2026-11-12T09:00:00.000Z',
      });

    const completedCreated = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Buy milk',
        notes: 'Mention C++ book in note',
        priority: 1,
        dueDate: '2026-11-13T09:00:00.000Z',
      });
    const completedId = (completedCreated.body as TaskResponse).data.id;
    await request(app)
      .patch(`/api/v1/tasks/${completedId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true });

    const searchRes = await request(app)
      .get('/api/v1/tasks')
      .query({ q: 'c++ (core)' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(searchRes.status).toBe(200);
    const searchData = searchRes.body as TaskListResponse;
    expect(searchData.data).toHaveLength(1);
    expect(searchData.data[0]?.title).toBe('Review C++ (core) [v1]');

    const notesSearch = await request(app)
      .get('/api/v1/tasks')
      .query({ q: 'C++', status: 'completed', priority: '1' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(notesSearch.status).toBe(200);
    expect((notesSearch.body as TaskListResponse).data).toHaveLength(1);
    expect((notesSearch.body as TaskListResponse).data[0]?.title).toBe('Buy milk');

    const rangeRes = await request(app)
      .get('/api/v1/tasks')
      .query({
        dueFrom: '2026-11-12T00:00:00.000Z',
        dueTo: '2026-11-12T23:59:59.999Z',
      })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(rangeRes.status).toBe(200);
    expect((rangeRes.body as TaskListResponse).data).toHaveLength(1);
  });

  it('sorts dueDate with nulls last and paginates stably with meta', async () => {
    const inputs = [
      { title: 'Undated A', dueDate: null },
      { title: 'Later', dueDate: '2026-11-15T10:00:00.000Z' },
      { title: 'Sooner', dueDate: '2026-11-12T10:00:00.000Z' },
      { title: 'Undated B', dueDate: null },
    ];

    for (const item of inputs) {
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(item);
    }

    const ascPage1 = await request(app)
      .get('/api/v1/tasks')
      .query({ sortBy: 'dueDate', order: 'asc', page: 1, limit: 2 })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(ascPage1.status).toBe(200);
    const p1 = ascPage1.body as TaskListResponse;
    expect(p1.meta).toEqual({
      page: 1,
      limit: 2,
      total: 4,
      hasNextPage: true,
    });
    expect(p1.data.map((t) => t.title)).toEqual(['Sooner', 'Later']);

    const ascPage2 = await request(app)
      .get('/api/v1/tasks')
      .query({ sortBy: 'dueDate', order: 'asc', page: 2, limit: 2 })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(ascPage2.status).toBe(200);
    const p2 = ascPage2.body as TaskListResponse;
    expect(p2.meta).toEqual({
      page: 2,
      limit: 2,
      total: 4,
      hasNextPage: false,
    });
    expect(p2.data.every((t) => t.dueDate === null)).toBe(true);

    const descRes = await request(app)
      .get('/api/v1/tasks')
      .query({ sortBy: 'dueDate', order: 'desc', page: 1, limit: 4 })
      .set('Authorization', `Bearer ${tokenA}`);
    const descData = (descRes.body as TaskListResponse).data;
    expect(descData.slice(0, 2).map((t) => t.title)).toEqual([
      'Later',
      'Sooner',
    ]);
    expect(descData.slice(2).every((t) => t.dueDate === null)).toBe(true);
  });

  it('computes Today summary counts using client timezone boundaries', async () => {
    // Client local day in +05:30: 2026-11-12T00:00:00+05:30 .. 2026-11-12T23:59:59.999+05:30
    const dueFrom = '2026-11-12T00:00:00.000+05:30';
    const dueTo = '2026-11-12T23:59:59.999+05:30';

    // 1) Overdue (yesterday local)
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Overdue active', dueDate: '2026-11-11T23:00:00+05:30' });

    // 2) Today active
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Today active', dueDate: '2026-11-12T09:00:00+05:30' });

    // 3) Today completed
    const todayDone = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Today done', dueDate: '2026-11-12T20:00:00+05:30' });
    await request(app)
      .patch(`/api/v1/tasks/${(todayDone.body as TaskResponse).data.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true });

    // 4) Upcoming active
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Tomorrow active', dueDate: '2026-11-13T09:00:00+05:30' });

    // 5) Undated active (must not count toward today, overdue, or upcoming)
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Someday', dueDate: null });

    const summaryRes = await request(app)
      .get('/api/v1/tasks/summary')
      .query({ dueFrom, dueTo })
      .set('Authorization', `Bearer ${tokenA}`);

    expect(summaryRes.status).toBe(200);
    expect((summaryRes.body as SummaryResponse).data).toEqual({
      today: { total: 2, completed: 1 },
      overdue: 1,
      upcoming: 1,
    });
  });
});
