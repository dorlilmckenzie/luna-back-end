import type { Response } from 'express';
import * as userService from '../services/user.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { clearRefreshCookie } from '../utils/cookies';
import type { AuthenticatedRequest } from '../types';

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await userService.getUserById(getUserId(req));
  sendSuccess(res, { user }, 'Profile loaded');
}

export async function updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await userService.updateProfile(getUserId(req), req.body);
  sendSuccess(res, { user }, 'Profile updated');
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  await userService.changePassword(
    getUserId(req),
    req.body.currentPassword,
    req.body.newPassword,
  );
  sendSuccess(res, null, 'Password changed. Please log in again on your other devices.');
}

export async function deleteMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  await userService.deleteAccount(getUserId(req), req.body.password);
  clearRefreshCookie(res);
  sendSuccess(res, null, 'Your account and all associated data have been deleted');
}
