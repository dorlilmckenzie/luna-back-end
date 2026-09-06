import { predictFromPeriods, PREDICTION_CONFIG } from '../src/services/prediction.service';
import { computeStatistics, buildCycles } from '../src/services/cycle.service';
import type { PeriodRecord } from '../src/services/cycle.service';

function period(start: string, end: string): PeriodRecord {
  return { id: start, startDate: new Date(start), endDate: new Date(end), flow: 'MEDIUM', notes: null };
}

describe('cycle statistics', () => {
  it('returns empty statistics when there is no data', () => {
    const stats = computeStatistics([]);
    expect(stats.cyclesTracked).toBe(0);
    expect(stats.averageCycleLength).toBeNull();
    expect(stats.averagePeriodLength).toBeNull();
  });

  it('computes averages, shortest and longest from real cycles', () => {
    const periods = [
      period('2026-05-01', '2026-05-05'),
      period('2026-05-29', '2026-06-02'), // 28-day cycle, 5-day period
      period('2026-06-28', '2026-07-01'), // 30-day cycle, 4-day period
      period('2026-07-26', '2026-07-31'), // 28-day cycle, 6-day period
    ];
    const stats = computeStatistics(periods);
    expect(stats.cyclesTracked).toBe(3);
    expect(stats.averageCycleLength).toBeCloseTo(28.7, 1);
    expect(stats.shortestCycle).toBe(28);
    expect(stats.longestCycle).toBe(30);
    expect(stats.shortestPeriod).toBe(4);
    expect(stats.longestPeriod).toBe(6);
  });

  it('ignores implausible gaps (skipped logging) when averaging', () => {
    const periods = [
      period('2026-01-01', '2026-01-05'),
      period('2026-05-01', '2026-05-05'), // ~120-day gap -> excluded
      period('2026-05-29', '2026-06-02'), // 28-day gap -> included
    ];
    const stats = computeStatistics(periods);
    expect(stats.cyclesTracked).toBe(1);
    expect(stats.averageCycleLength).toBe(28);
  });
});

describe('predictFromPeriods', () => {
  it('flags insufficient data with no periods', () => {
    const result = predictFromPeriods([]);
    expect(result.hasEnoughData).toBe(false);
    expect(result.confidence).toBe('none');
    expect(result.nextPeriod).toBeNull();
    expect(result.disclaimer).toMatch(/not.*medical advice/i);
  });

  it('predicts the next period as lastStart + averageCycleLength', () => {
    const today = new Date('2026-08-10');
    const periods = [
      period('2026-05-05', '2026-05-09'),
      period('2026-06-02', '2026-06-06'), // 28
      period('2026-06-30', '2026-07-04'), // 28
      period('2026-07-28', '2026-08-01'), // 28
    ];
    const result = predictFromPeriods(periods, today);
    expect(result.averageCycleLength).toBe(28);
    expect(result.nextPeriod?.startDate).toBe('2026-08-25'); // 2026-07-28 + 28
    expect(result.hasEnoughData).toBe(true);
    expect(['medium', 'high']).toContain(result.confidence);
  });

  it('estimates ovulation LUTEAL_PHASE_DAYS before the next period', () => {
    const today = new Date('2026-08-10');
    const periods = [
      period('2026-06-02', '2026-06-06'),
      period('2026-06-30', '2026-07-04'),
      period('2026-07-28', '2026-08-01'),
    ];
    const result = predictFromPeriods(periods, today);
    const next = new Date(result.nextPeriod!.startDate);
    const ov = new Date(result.ovulation!.estimatedDate);
    const diff = Math.round((next.getTime() - ov.getTime()) / (24 * 60 * 60 * 1000));
    expect(diff).toBe(PREDICTION_CONFIG.LUTEAL_PHASE_DAYS);
  });

  it('produces a fertile window that ends on or after ovulation', () => {
    const today = new Date('2026-08-10');
    const periods = [
      period('2026-06-02', '2026-06-06'),
      period('2026-06-30', '2026-07-04'),
      period('2026-07-28', '2026-08-01'),
    ];
    const result = predictFromPeriods(periods, today);
    expect(new Date(result.fertileWindow!.endDate) >= new Date(result.ovulation!.estimatedDate)).toBe(
      true,
    );
    expect(new Date(result.fertileWindow!.startDate) < new Date(result.ovulation!.estimatedDate)).toBe(
      true,
    );
  });

  it('rolls the prediction forward when the last period is stale', () => {
    const today = new Date('2026-12-01');
    const periods = [
      period('2026-06-02', '2026-06-06'),
      period('2026-06-30', '2026-07-04'),
      period('2026-07-28', '2026-08-01'),
    ];
    const result = predictFromPeriods(periods, today);
    expect(new Date(result.nextPeriod!.startDate) >= today).toBe(true);
    expect(result.note).toMatch(/while since your last logged period/i);
  });

  it('marks confidence low with only one or two cycles', () => {
    const result = predictFromPeriods(
      [period('2026-07-01', '2026-07-05'), period('2026-07-29', '2026-08-02')],
      new Date('2026-08-05'),
    );
    expect(result.confidence).toBe('low');
    expect(result.note).toMatch(/limited/i);
  });
});

describe('buildCycles', () => {
  it('sorts by start date and derives period/cycle length', () => {
    const cycles = buildCycles([
      period('2026-07-28', '2026-08-01'),
      period('2026-06-30', '2026-07-04'),
    ]);
    expect(cycles[0].periodStart).toContain('2026-06-30');
    expect(cycles[0].cycleLength).toBe(28);
    expect(cycles[0].periodLength).toBe(5);
    expect(cycles[1].cycleLength).toBeNull();
  });
});
