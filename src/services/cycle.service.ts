import { prisma } from '../config/database';
import { addDays, average, differenceInDays, inclusiveDayCount, startOfUtcDay } from '../utils/dates';

export interface PeriodRecord {
  id: string;
  startDate: Date;
  endDate: Date | null;
  flow: string;
  notes: string | null;
}

export interface Cycle {
  index: number;
  periodStart: string;
  periodEnd: string | null;
  periodLength: number | null;
  // Days from this period start to the next period start. null for the most recent cycle.
  cycleLength: number | null;
}

export interface CycleStatistics {
  cyclesTracked: number;
  averageCycleLength: number | null;
  shortestCycle: number | null;
  longestCycle: number | null;
  averagePeriodLength: number | null;
  shortestPeriod: number | null;
  longestPeriod: number | null;
  periodsLogged: number;
  lastPeriodStart: string | null;
}

/** Sort ascending by start date and build a per-cycle view from raw period rows. */
export function buildCycles(periods: PeriodRecord[]): Cycle[] {
  const sorted = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return sorted.map((period, i) => {
    const next = sorted[i + 1];
    const periodLength = period.endDate
      ? inclusiveDayCount(period.startDate, period.endDate)
      : null;
    const cycleLength = next ? differenceInDays(period.startDate, next.startDate) : null;

    return {
      index: i + 1,
      periodStart: startOfUtcDay(period.startDate).toISOString(),
      periodEnd: period.endDate ? startOfUtcDay(period.endDate).toISOString() : null,
      periodLength,
      cycleLength,
    };
  });
}

/**
 * Cycle lengths considered "plausible" for averaging. Filters out data entry mistakes
 * and skipped logs (e.g. a 90-day gap because the user forgot to log for two months).
 */
export function plausibleCycleLengths(cycles: Cycle[]): number[] {
  return cycles
    .map((c) => c.cycleLength)
    .filter((n): n is number => n !== null && n >= 15 && n <= 60);
}

export function computeStatistics(periods: PeriodRecord[]): CycleStatistics {
  const cycles = buildCycles(periods);
  const cycleLengths = plausibleCycleLengths(cycles);
  const periodLengths = cycles
    .map((c) => c.periodLength)
    .filter((n): n is number => n !== null && n >= 1 && n <= 15);

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const sorted = [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return {
    cyclesTracked: cycleLengths.length,
    averageCycleLength: cycleLengths.length ? round1(average(cycleLengths)) : null,
    shortestCycle: cycleLengths.length ? Math.min(...cycleLengths) : null,
    longestCycle: cycleLengths.length ? Math.max(...cycleLengths) : null,
    averagePeriodLength: periodLengths.length ? round1(average(periodLengths)) : null,
    shortestPeriod: periodLengths.length ? Math.min(...periodLengths) : null,
    longestPeriod: periodLengths.length ? Math.max(...periodLengths) : null,
    periodsLogged: periods.length,
    lastPeriodStart: sorted[0] ? startOfUtcDay(sorted[0].startDate).toISOString() : null,
  };
}

export async function getPeriodsForUser(userId: string): Promise<PeriodRecord[]> {
  return prisma.period.findMany({
    where: { userId },
    orderBy: { startDate: 'asc' },
    select: { id: true, startDate: true, endDate: true, flow: true, notes: true },
  });
}

export async function getCyclesForUser(userId: string): Promise<Cycle[]> {
  const periods = await getPeriodsForUser(userId);
  return buildCycles(periods);
}

export async function getStatisticsForUser(userId: string): Promise<CycleStatistics> {
  const periods = await getPeriodsForUser(userId);
  return computeStatistics(periods);
}

/**
 * "Current cycle day": days since the most recent period start (1-indexed), plus a flag
 * for whether the user is currently within a logged period.
 */
export function currentCycleInfo(periods: PeriodRecord[], today = new Date()) {
  if (periods.length === 0) {
    return { cycleDay: null, onPeriod: false, lastPeriodStart: null, lastPeriodEnd: null };
  }
  const sorted = [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const last = sorted[0];
  const cycleDay = differenceInDays(last.startDate, today) + 1;
  const onPeriod = last.endDate
    ? startOfUtcDay(today) <= startOfUtcDay(last.endDate) &&
      startOfUtcDay(today) >= startOfUtcDay(last.startDate)
    : differenceInDays(last.startDate, today) <= 6 && differenceInDays(last.startDate, today) >= 0;

  return {
    cycleDay: cycleDay >= 1 ? cycleDay : null,
    onPeriod,
    lastPeriodStart: startOfUtcDay(last.startDate).toISOString(),
    lastPeriodEnd: last.endDate ? startOfUtcDay(last.endDate).toISOString() : null,
    nextExpectedFrom: last.startDate,
  };
}

export { addDays };
