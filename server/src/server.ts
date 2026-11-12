import http from 'node:http';

import mongoose from 'mongoose';

import { createApp, logger } from './app.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Daybook API listening');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down HTTP server');
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
        process.exit(1);
      }
      void mongoose
        .disconnect()
        .then(() => {
          logger.info('Disconnected from MongoDB');
          process.exit(0);
        })
        .catch((dbErr: unknown) => {
          logger.error({ err: dbErr }, 'Error disconnecting from MongoDB');
          process.exit(1);
        });
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

void start().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start Daybook API');
  process.exit(1);
});
