import type { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { UserModel } from '../modules/users/model.js';

interface AuthPayload {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
      passwordHash?: string;
    };
    token: string;
  };
}

interface MePayload {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface ErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

describe('Health and Auth API', () => {
  let mongoServer: MongoMemoryServer;
  let app: Express;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    app = createApp();
  });

  it('responds to GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: {
        status: 'ok',
      },
    });
  });

  it('registers a user, normalizes email, omits passwordHash, and returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: '  Asha Rao  ',
      email: '  Asha@Example.COM ',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    const body = res.body as AuthPayload;
    expect(body.data.user.name).toBe('Asha Rao');
    expect(body.data.user.email).toBe('asha@example.com');
    expect(body.data.user.passwordHash).toBeUndefined();
    expect(typeof body.data.token).toBe('string');
    expect(body.data.token.split('.')).toHaveLength(3);
  });

  it('rejects duplicate email registration with 409 CONFLICT', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'Password123!',
    });

    const dup = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha Two',
      email: 'ASHA@example.com',
      password: 'Password123!',
    });

    expect(dup.status).toBe(409);
    const body = dup.body as ErrorPayload;
    expect(body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid register input with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: '   ',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    const body = res.body as ErrorPayload;
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
  });

  it('logs in with valid credentials and returns identical errors for unknown email and wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'Password123!',
    });

    const okRes = await request(app).post('/api/v1/auth/login').send({
      email: 'asha@example.com',
      password: 'Password123!',
    });
    expect(okRes.status).toBe(200);
    const okBody = okRes.body as AuthPayload;
    expect(okBody.data.user.email).toBe('asha@example.com');
    expect(typeof okBody.data.token).toBe('string');

    const wrongPassRes = await request(app).post('/api/v1/auth/login').send({
      email: 'asha@example.com',
      password: 'WrongPassword!',
    });
    const unknownEmailRes = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'WrongPassword!',
    });

    expect(wrongPassRes.status).toBe(401);
    expect(unknownEmailRes.status).toBe(401);
    const wrongPassBody = wrongPassRes.body as ErrorPayload;
    const unknownEmailBody = unknownEmailRes.body as ErrorPayload;
    expect(wrongPassBody.error.code).toBe('UNAUTHORIZED');
    expect(unknownEmailBody.error.code).toBe('UNAUTHORIZED');
    expect(wrongPassBody.error.message).toBe(unknownEmailBody.error.message);
  });

  it('protects GET /api/v1/auth/me and returns current user for a valid token', async () => {
    const noTokenRes = await request(app).get('/api/v1/auth/me');
    expect(noTokenRes.status).toBe(401);

    const badTokenRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(badTokenRes.status).toBe(401);

    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'Password123!',
    });
    const { token, user } = (regRes.body as AuthPayload).data;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    const meBody = meRes.body as MePayload;
    expect(meBody.data.user.id).toBe(user.id);
    expect(meBody.data.user.email).toBe('asha@example.com');
  });

  it('enforces 10 requests per 15 minutes rate limit on /api/v1/auth/*', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });
      expect(res.status).toBe(401);
    }

    const limited = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password123!',
    });
    expect(limited.status).toBe(429);
    const body = limited.body as ErrorPayload;
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});
