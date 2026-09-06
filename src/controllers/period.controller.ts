import type { Response } from 'express';
import * as periodService from '../services/period.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { from, to, limit } = req.query as { from?: string; to?: string; limit?: number };
  const periods = await periodService.listPeriods(getUserId(req), { from, to, limit });
  sendSuccess(res, { periods }, 'Periods loaded');
}

export async function getById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const period = await periodService.getPeriod(getUserId(req), req.params.id);
  sendSuccess(res, { period }, 'Period loaded');
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const period = await periodService.createPeriod(getUserId(req), req.body);
  sendCreated(res, { period }, 'Period logged');
}

export async function update(req: AuthenticatedRequest, res: Response): Promise<void> {
  const period = await periodService.updatePeriod(getUserId(req), req.params.id, req.body);
  sendSuccess(res, { period }, 'Period updated');
}

export async function remove(req: AuthenticatedRequest, res: Response): Promise<void> {
  await periodService.deletePeriod(getUserId(req), req.params.id);
  sendSuccess(res, null, 'Period deleted');
}
