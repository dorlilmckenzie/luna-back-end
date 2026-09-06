import type { Response } from 'express';
import * as cycleService from '../services/cycle.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../types';

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const cycles = await cycleService.getCyclesForUser(getUserId(req));
  sendSuccess(res, { cycles }, 'Cycle history loaded');
}

export async function statistics(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stats = await cycleService.getStatisticsForUser(getUserId(req));
  sendSuccess(res, { statistics: stats }, 'Statistics computed');
}

export async function summary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  const periods = await cycleService.getPeriodsForUser(userId);
  const stats = cycleService.computeStatistics(periods);
  const current = cycleService.currentCycleInfo(periods);
  sendSuccess(res, { current, statistics: stats }, 'Dashboard summary');
}
