import {
  buildCycles,
  computeStatistics,
  getPeriodsForUser,
  plausibleCycleLengths,
  type PeriodRecord,
} from './cycle.service';
import { addDays, average, differenceInDays, startOfUtcDay, toIsoDateString } from '../utils/dates';

/**
 * Prediction configuration. Kept here so the algorithm can be tuned or swapped later
 * without touching controllers. Luteal phase length is relatively stable (~14 days),
 * so ovulation is estimated as (next period start - LUTEAL_PHASE_DAYS).
 */
export const PREDICTION_CONFIG = {
  DEFAULT_CYCLE_LENGTH: 28,
  DEFAULT_PERIOD_LENGTH: 5,
  LUTEAL_PHASE_DAYS: 14,
  FERTILE_WINDOW_BEFORE_OVULATION: 5,
  FERTILE_WINDOW_AFTER_OVULATION: 1,
  MIN_CYCLES_FOR_CONFIDENT_PREDICTION: 3,
};

export type PredictionConfidence = 'none' | 'low' | 'medium' | 'high';

export interface PredictionResult {
  hasEnoughData: boolean;
  confidence: PredictionConfidence;
  basedOnCycles: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart: string | null;
  nextPeriod: {
    startDate: string;
    endDate: string;
    // Range accounts for natural cycle variability.
    earliest: string;
    latest: string;
  } | null;
  ovulation: { estimatedDate: string } | null;
  fertileWindow: { startDate: string; endDate: string } | null;
  disclaimer: string;
  note?: string;
}

const DISCLAIMER =
  'Predictions are estimates based on your logged history. They are not medical advice and must not be used as contraception.';

function confidenceFor(cycleCount: number, spread: number): PredictionConfidence {
  if (cycleCount === 0) return 'none';
  if (cycleCount < PREDICTION_CONFIG.MIN_CYCLES_FOR_CONFIDENT_PREDICTION) return 'low';
  if (spread > 9) return 'medium';
  return 'high';
}

export function predictFromPeriods(periods: PeriodRecord[], today = new Date()): PredictionResult {
  const stats = computeStatistics(periods);
  const cycles = buildCycles(periods);
  const cycleLengths = plausibleCycleLengths(cycles);

  const sortedByRecent = [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const lastPeriod = sortedByRecent[0] ?? null;

  const averageCycleLength = cycleLengths.length
    ? Math.round(average(cycleLengths))
    : PREDICTION_CONFIG.DEFAULT_CYCLE_LENGTH;
  const averagePeriodLength =
    stats.averagePeriodLength ?? PREDICTION_CONFIG.DEFAULT_PERIOD_LENGTH;

  const spread = cycleLengths.length
    ? Math.max(...cycleLengths) - Math.min(...cycleLengths)
    : 0;
  const confidence = confidenceFor(cycleLengths.length, spread);
  const hasEnoughData = cycleLengths.length >= 1 && !!lastPeriod;

  if (!lastPeriod) {
    return {
      hasEnoughData: false,
      confidence: 'none',
      basedOnCycles: 0,
      averageCycleLength,
      averagePeriodLength: Math.round(averagePeriodLength),
      lastPeriodStart: null,
      nextPeriod: null,
      ovulation: null,
      fertileWindow: null,
      disclaimer: DISCLAIMER,
      note: 'Log at least one period to start seeing predictions.',
    };
  }

  const nextStart = addDays(lastPeriod.startDate, averageCycleLength);
  const nextEnd = addDays(nextStart, Math.max(1, Math.round(averagePeriodLength) - 1));
  const variability = cycleLengths.length >= 2 ? Math.min(7, Math.max(2, Math.round(spread / 2))) : 3;

  const ovulationDate = addDays(nextStart, -PREDICTION_CONFIG.LUTEAL_PHASE_DAYS);
  const fertileStart = addDays(
    ovulationDate,
    -PREDICTION_CONFIG.FERTILE_WINDOW_BEFORE_OVULATION,
  );
  const fertileEnd = addDays(ovulationDate, PREDICTION_CONFIG.FERTILE_WINDOW_AFTER_OVULATION);

  const result: PredictionResult = {
    hasEnoughData,
    confidence,
    basedOnCycles: cycleLengths.length,
    averageCycleLength,
    averagePeriodLength: Math.round(averagePeriodLength),
    lastPeriodStart: toIsoDateString(lastPeriod.startDate),
    nextPeriod: {
      startDate: toIsoDateString(nextStart),
      endDate: toIsoDateString(nextEnd),
      earliest: toIsoDateString(addDays(nextStart, -variability)),
      latest: toIsoDateString(addDays(nextStart, variability)),
    },
    ovulation: { estimatedDate: toIsoDateString(ovulationDate) },
    fertileWindow: {
      startDate: toIsoDateString(fertileStart),
      endDate: toIsoDateString(fertileEnd),
    },
    disclaimer: DISCLAIMER,
  };

  if (!hasEnoughData || confidence === 'low') {
    result.note =
      'Predictions are limited until you have logged a few complete cycles. Accuracy improves with more history.';
  }

  // If the predicted next period is already in the past (user hasn't logged recently),
  // roll forward so the estimate stays useful.
  if (differenceInDays(nextStart, today) > averageCycleLength) {
    const cyclesElapsed = Math.floor(
      differenceInDays(lastPeriod.startDate, today) / averageCycleLength,
    );
    const rolledStart = addDays(lastPeriod.startDate, (cyclesElapsed + 1) * averageCycleLength);
    const rolledEnd = addDays(rolledStart, Math.max(1, Math.round(averagePeriodLength) - 1));
    const rolledOvulation = addDays(rolledStart, -PREDICTION_CONFIG.LUTEAL_PHASE_DAYS);
    result.nextPeriod = {
      startDate: toIsoDateString(rolledStart),
      endDate: toIsoDateString(rolledEnd),
      earliest: toIsoDateString(addDays(rolledStart, -variability)),
      latest: toIsoDateString(addDays(rolledStart, variability)),
    };
    result.ovulation = { estimatedDate: toIsoDateString(rolledOvulation) };
    result.fertileWindow = {
      startDate: toIsoDateString(
        addDays(rolledOvulation, -PREDICTION_CONFIG.FERTILE_WINDOW_BEFORE_OVULATION),
      ),
      endDate: toIsoDateString(
        addDays(rolledOvulation, PREDICTION_CONFIG.FERTILE_WINDOW_AFTER_OVULATION),
      ),
    };
    result.note =
      'It has been a while since your last logged period. This estimate assumes your average cycle length has continued.';
  }

  return result;
}

export async function getPredictionForUser(userId: string): Promise<PredictionResult> {
  const periods = await getPeriodsForUser(userId);
  return predictFromPeriods(periods);
}

/**
 * Calendar overlay for a given month: which days are predicted period / fertile / ovulation.
 * Returns ISO date strings (YYYY-MM-DD).
 */
export function predictedDaysForRange(
  prediction: PredictionResult,
  rangeStart: Date,
  rangeEnd: Date,
): { predictedPeriod: string[]; fertileWindow: string[]; ovulation: string[] } {
  const predictedPeriod: string[] = [];
  const fertileWindow: string[] = [];
  const ovulation: string[] = [];
  if (!prediction.nextPeriod) return { predictedPeriod, fertileWindow, ovulation };

  const clampPush = (arr: string[], from: Date, to: Date) => {
    let cursor = startOfUtcDay(from);
    const end = startOfUtcDay(to);
    while (cursor <= end) {
      if (cursor >= startOfUtcDay(rangeStart) && cursor <= startOfUtcDay(rangeEnd)) {
        arr.push(toIsoDateString(cursor));
      }
      cursor = addDays(cursor, 1);
    }
  };

  // Project several cycles forward so navigating months ahead still shows overlays.
  for (let i = 0; i < 6; i += 1) {
    const shift = i * prediction.averageCycleLength;
    clampPush(
      predictedPeriod,
      addDays(prediction.nextPeriod.startDate, shift),
      addDays(prediction.nextPeriod.endDate, shift),
    );
    if (prediction.fertileWindow) {
      clampPush(
        fertileWindow,
        addDays(prediction.fertileWindow.startDate, shift),
        addDays(prediction.fertileWindow.endDate, shift),
      );
    }
    if (prediction.ovulation) {
      const ov = addDays(prediction.ovulation.estimatedDate, shift);
      if (ov >= startOfUtcDay(rangeStart) && ov <= startOfUtcDay(rangeEnd)) {
        ovulation.push(toIsoDateString(ov));
      }
    }
  }

  return { predictedPeriod, fertileWindow, ovulation };
}
