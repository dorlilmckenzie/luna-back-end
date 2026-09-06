import {
  addDays,
  average,
  differenceInDays,
  inclusiveDayCount,
  median,
  startOfUtcDay,
  toIsoDateString,
} from '../src/utils/dates';

describe('date utilities', () => {
  it('startOfUtcDay strips the time component', () => {
    expect(startOfUtcDay('2026-09-05T14:33:00Z').toISOString()).toBe('2026-09-05T00:00:00.000Z');
  });

  it('addDays moves forward and backward', () => {
    expect(toIsoDateString(addDays('2026-09-05', 28))).toBe('2026-10-03');
    expect(toIsoDateString(addDays('2026-09-05', -5))).toBe('2026-08-31');
  });

  it('differenceInDays counts whole days', () => {
    expect(differenceInDays('2026-09-01', '2026-09-29')).toBe(28);
    expect(differenceInDays('2026-09-29', '2026-09-01')).toBe(-28);
  });

  it('inclusiveDayCount includes both endpoints', () => {
    expect(inclusiveDayCount('2026-09-01', '2026-09-05')).toBe(5);
  });

  it('average and median', () => {
    expect(average([2, 4, 6])).toBe(4);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([5, 1, 3])).toBe(3);
  });
});
