import 'dotenv/config';
import { z } from 'zod';

const rawEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().optional(),
});

const envSchema = rawEnvSchema.transform((data) => {
  const secret = data.JWT_SECRET || data.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['JWT_SECRET'],
        message:
          'JWT_SECRET (or JWT_ACCESS_SECRET) is required and must be at least 32 characters',
      },
    ]);
  }

  const expiresIn = data.JWT_EXPIRES_IN || data.JWT_ACCESS_EXPIRES_IN || '7d';

  return {
    PORT: data.PORT,
    NODE_ENV: data.NODE_ENV,
    MONGODB_URI: data.MONGODB_URI,
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: expiresIn,
  };
});

export type Env = z.output<typeof envSchema>;

let envConfig: Env;
try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      'Invalid environment configuration:',
      z.treeifyError(error),
    );
  } else {
    console.error('Invalid environment configuration:', error);
  }
  process.exit(1);
}

export const env: Env = envConfig;
