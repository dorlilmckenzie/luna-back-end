const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normalise a date to midnight UTC so day-based math is stable. */
export function startOfUtcDay(input: Date | string): Date {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(input: Date | string, days: number): Date {
  const d = startOfUtcDay(input);
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/** Whole days from a -> b (b - a). Can be negative. */
export function differenceInDays(a: Date | string, b: Date | string): number {
  return Math.round((startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime()) / MS_PER_DAY);
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Inclusive day count between two dates. startOfUtcDay applied to both. */
export function inclusiveDayCount(start: Date | string, end: Date | string): number {
  return differenceInDays(start, end) + 1;
}

export function toIsoDateString(input: Date | string): string {
  return startOfUtcDay(input).toISOString().slice(0, 10);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
