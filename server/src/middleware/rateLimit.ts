import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

function buildRateLimitResponse(message: string) {
  return {
    error: {
      code: 'RATE_LIMITED' as const,
      message,
    },
  };
}

export function createAuthRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: buildRateLimitResponse(
      'Too many authentication attempts, please try again later',
    ),
  });
}

export function createApiRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: buildRateLimitResponse(
      'Too many requests, please slow down and try again',
    ),
  });
}
