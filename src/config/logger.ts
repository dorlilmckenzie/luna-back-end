import { isTest } from './env';

/**
 * Minimal privacy-conscious logger.
 * We deliberately never log request bodies, period data, symptoms, moods or notes.
 */
type Level = 'info' | 'warn' | 'error';

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (isTest) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'info' ? 'log' : level](JSON.stringify(line));
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
