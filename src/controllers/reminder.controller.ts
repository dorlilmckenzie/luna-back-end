import type { Response } from 'express';
import * as reminderService from '../services/reminder.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export async function get(req: AuthenticatedRequest, res: Response): Promise<void> {
  const reminders = await reminderService.getReminderPreference(getUserId(req));
  sendSuccess(res, { reminders }, 'Reminder preferences loaded');
}

export async function update(req: AuthenticatedRequest, res: Response): Promise<void> {
  const reminders = await reminderService.updateReminderPreference(getUserId(req), req.body);
  sendSuccess(res, { reminders }, 'Reminder preferences updated');
}
