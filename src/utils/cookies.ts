import type { Response } from 'express';
import { env, isProd } from '../config/env';
import { durationToMs } from './jwt';

export const REFRESH_COOKIE_NAME = 'pt_refresh_token';

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    expires: expiresAt,
    maxAge: durationToMs(env.REFRESH_TOKEN_EXPIRES_IN),
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
  });
}
