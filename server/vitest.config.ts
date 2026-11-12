import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/daybook-test',
      JWT_SECRET: 'daybook-test-secret-key-minimum-32-characters',
      JWT_EXPIRES_IN: '7d',
    },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
