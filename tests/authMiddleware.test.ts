import type { Response } from 'express';
import { requireAuth } from '../src/middleware/auth.middleware';
import { signAccessToken } from '../src/utils/jwt';
import { ApiError } from '../src/utils/apiError';
import type { AuthenticatedRequest } from '../src/types';

function mockReqRes(authHeader?: string) {
  const req = { headers: authHeader ? { authorization: authHeader } : {} } as AuthenticatedRequest;
  const res = {} as Response;
  const next = jest.fn();
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('rejects requests with no Authorization header', () => {
    const { req, res, next } = mockReqRes();
    expect(() => requireAuth(req, res, next)).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed header', () => {
    const { req, res, next } = mockReqRes('Token abc');
    expect(() => requireAuth(req, res, next)).toThrow(/Authorization header/);
  });

  it('rejects an invalid token', () => {
    const { req, res, next } = mockReqRes('Bearer not-a-real-jwt');
    expect(() => requireAuth(req, res, next)).toThrow(/session has expired/i);
  });

  it('accepts a valid token and populates req.user', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ sub: 'user-1', email: 'a@b.com' });
  });
});
