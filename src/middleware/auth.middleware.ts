import type { NextFunction, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import type { AuthenticatedRequest } from '../types';

/**
 * Requires a valid Bearer access token. Populates req.user.
 * Every protected route uses this; ownership checks live in the services.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub, email: payload.email };
    next();
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }
}

export function getUserId(req: AuthenticatedRequest): string {
  if (!req.user?.sub) throw ApiError.unauthorized();
  return req.user.sub;
}
