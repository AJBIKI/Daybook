import http from 'node:http';

import { createApp, logger } from './app.js';
import { env } from './config/env.js';

function start(): void {
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
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

start();
