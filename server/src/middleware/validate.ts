import type { RequestHandler, Response } from 'express';
import { z, type ZodType } from 'zod';

import { AppError } from '../utils/AppError.js';

export interface ValidationSchemas<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> {
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  params?: ZodType<TParams>;
}

export interface ValidatedData<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

const validatedStore = new WeakMap<Response, ValidatedData>();

export function getValidated<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
>(res: Response): ValidatedData<TBody, TQuery, TParams> {
  const data = validatedStore.get(res);
  if (!data) {
    throw new AppError(500, 'INTERNAL', 'Validated request data missing');
  }
  return data as ValidatedData<TBody, TQuery, TParams>;
}

export function validate<TBody = unknown, TQuery = unknown, TParams = unknown>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>,
): RequestHandler {
  return (req, res, next) => {
    const validated: ValidatedData = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid request body',
            z.flattenError(result.error).fieldErrors,
          ),
        );
        return;
      }
      validated.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid query parameters',
            z.flattenError(result.error).fieldErrors,
          ),
        );
        return;
      }
      validated.query = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid route parameters',
            z.flattenError(result.error).fieldErrors,
          ),
        );
        return;
      }
      validated.params = result.data;
    }

    validatedStore.set(res, validated);
    next();
  };
}
