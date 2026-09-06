import type { Response } from 'express';
import * as moodService from '../services/mood.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  const moods = await moodService.listMoods(getUserId(req), { from, to });
  sendSuccess(res, { moods }, 'Moods loaded');
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const mood = await moodService.createMood(getUserId(req), req.body);
  sendCreated(res, { mood }, 'Mood logged');
}

export async function update(req: AuthenticatedRequest, res: Response): Promise<void> {
  const mood = await moodService.updateMood(getUserId(req), req.params.id, req.body);
  sendSuccess(res, { mood }, 'Mood updated');
}

export async function remove(req: AuthenticatedRequest, res: Response): Promise<void> {
  await moodService.deleteMood(getUserId(req), req.params.id);
  sendSuccess(res, null, 'Mood deleted');
}
