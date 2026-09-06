import type { Response } from 'express';
import { getPredictionForUser } from '../services/prediction.service';
import { predictedDaysForRange } from '../services/prediction.service';
import { getUserId } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import { startOfUtcDay } from '../utils/dates';
import type { AuthenticatedRequest } from '../types';

export async function get(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prediction = await getPredictionForUser(getUserId(req));
  sendSuccess(res, { prediction }, 'Prediction generated');
}

export async function nextPeriod(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prediction = await getPredictionForUser(getUserId(req));
  sendSuccess(
    res,
    {
      nextPeriod: prediction.nextPeriod,
      confidence: prediction.confidence,
      hasEnoughData: prediction.hasEnoughData,
      disclaimer: prediction.disclaimer,
      note: prediction.note,
    },
    'Next period prediction',
  );
}

export async function fertileWindow(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prediction = await getPredictionForUser(getUserId(req));
  sendSuccess(
    res,
    {
      fertileWindow: prediction.fertileWindow,
      ovulation: prediction.ovulation,
      confidence: prediction.confidence,
      hasEnoughData: prediction.hasEnoughData,
      disclaimer: prediction.disclaimer,
      note: prediction.note,
    },
    'Fertile window estimate',
  );
}

export async function calendarOverlay(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  const rangeStart = from ? startOfUtcDay(from) : startOfUtcDay(new Date());
  const rangeEnd = to
    ? startOfUtcDay(to)
    : startOfUtcDay(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  const prediction = await getPredictionForUser(getUserId(req));
  const overlay = predictedDaysForRange(prediction, rangeStart, rangeEnd);
  sendSuccess(res, { overlay, prediction }, 'Calendar overlay');
}
