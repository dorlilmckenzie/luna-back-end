import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    apiError = ApiError.validation(
      'Please correct the highlighted fields',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      apiError = ApiError.conflict('That value is already in use');
    } else if (err.code === 'P2025') {
      apiError = ApiError.notFound();
    } else {
      apiError = ApiError.internal();
    }
  } else {
    apiError = ApiError.internal();
  }

  // Log technical detail internally only. Never log request bodies (may contain health data).
  if (apiError.statusCode >= 500) {
    logger.error('Unhandled error', {
      method: req.method,
      path: req.path,
      message: err instanceof Error ? err.message : String(err),
      stack: !isProd && err instanceof Error ? err.stack : undefined,
    });
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  });
}
