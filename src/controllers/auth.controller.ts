import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { getUserById } from '../services/user.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../utils/cookies';
import type { AuthenticatedRequest } from '../types';

export async function register(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, password, dateOfBirth } = req.body;
  const result = await authService.register({
    firstName,
    lastName,
    email,
    password,
    dateOfBirth,
    userAgent: req.headers['user-agent'],
  });

  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  sendCreated(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Account created successfully',
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    userAgent: req.headers['user-agent'],
  });

  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  sendSuccess(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Logged in successfully',
  );
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(token);
  clearRefreshCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  await authService.requestPasswordReset(req.body.email);
  // Always the same response, whether or not the account exists.
  sendSuccess(
    res,
    null,
    'If an account exists for that email, a password reset link has been sent.',
  );
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, 'Your password has been reset. You can now log in.');
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await getUserById(getUserId(req));
  sendSuccess(res, { user }, 'Current user');
}
