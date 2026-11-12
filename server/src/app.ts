import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import {
  createErrorHandler,
  notFoundHandler,
} from './middleware/errorHandler.js';
import { createApiRateLimiter } from './middleware/rateLimit.js';
import { createAuthRouter } from './modules/auth/routes.js';
import { createTasksRouter } from './modules/tasks/routes.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.passwordHash',
    ],
    censor: '[REDACTED]',
  },
});

export function createApp(): Express {
  const app = express();

  // Render terminates TLS at a reverse proxy, so trust X-Forwarded-* headers.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      data: {
        status: 'ok',
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  });

  app.use('/api/v1', createApiRateLimiter());
  app.use('/api/v1/auth', createAuthRouter());
  app.use('/api/v1/tasks', createTasksRouter());

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
