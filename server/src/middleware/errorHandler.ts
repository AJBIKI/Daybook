import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError, z } from 'zod';

import { env } from '../config/env.js';
import { AppError, type ErrorCode } from '../utils/AppError.js';

interface ErrorResponseBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === 11000
  );
}

function isJsonSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400
  );
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
};

export function createErrorHandler(logger: {
  error: (obj: unknown, msg: string) => void;
}): ErrorRequestHandler {
  return (err: unknown, req, res, _next) => {
    if (err instanceof AppError) {
      const body: ErrorResponseBody = {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      };
      res.status(err.statusCode).json(body);
      return;
    }

    if (err instanceof ZodError) {
      const body: ErrorResponseBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: z.flattenError(err).fieldErrors,
        },
      };
      res.status(400).json(body);
      return;
    }

    if (isJsonSyntaxError(err)) {
      const body: ErrorResponseBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Malformed JSON request body',
        },
      };
      res.status(400).json(body);
      return;
    }

    if (isMongoDuplicateKeyError(err)) {
      const body: ErrorResponseBody = {
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
      };
      res.status(409).json(body);
      return;
    }

    if (err instanceof mongoose.Error.ValidationError) {
      const body: ErrorResponseBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      };
      res.status(400).json(body);
      return;
    }

    if (err instanceof mongoose.Error.CastError) {
      const body: ErrorResponseBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid identifier format',
        },
      };
      res.status(400).json(body);
      return;
    }

    logger.error(
      { err, method: req.method, path: req.originalUrl },
      'Unhandled server error',
    );

    const body: ErrorResponseBody = {
      error: {
        code: 'INTERNAL',
        message:
          env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err instanceof Error
              ? err.message
              : 'Internal server error',
      },
    };
    res.status(500).json(body);
  };
}
