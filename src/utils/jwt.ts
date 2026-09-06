import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthTokenPayload } from '../types';

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

/**
 * The refresh token is an opaque random string. We sign it so it is self-verifiable,
 * but we also store a hash of it in the DB so it can be revoked.
 */
export function generateRefreshToken(userId: string): string {
  const jti = crypto.randomBytes(32).toString('hex');
  return jwt.sign({ sub: userId, jti }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { sub: string; jti: string };
}

/** Deterministic hash used to store tokens at rest (refresh + password-reset). */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Parse strings like "7d", "15m", "30s", "12h" into milliseconds. */
export function durationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
