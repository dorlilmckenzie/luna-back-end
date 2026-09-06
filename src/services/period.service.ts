import type { Flow } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { startOfUtcDay } from '../utils/dates';

export interface PeriodDTO {
  id: string;
  startDate: string;
  endDate: string | null;
  flow: Flow;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(p: {
  id: string;
  startDate: Date;
  endDate: Date | null;
  flow: Flow;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PeriodDTO {
  return {
    id: p.id,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate ? p.endDate.toISOString() : null,
    flow: p.flow,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Fetch a period and assert the requesting user owns it. Used by GET/PATCH/DELETE by id. */
async function getOwnedPeriodOrThrow(userId: string, id: string) {
  const period = await prisma.period.findUnique({ where: { id } });
  if (!period || period.userId !== userId) {
    // Same 404 whether it doesn't exist or belongs to someone else.
    throw ApiError.notFound('Period record not found');
  }
  return period;
}

export async function listPeriods(
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {},
): Promise<PeriodDTO[]> {
  const periods = await prisma.period.findMany({
    where: {
      userId,
      ...(opts.from || opts.to
        ? {
            startDate: {
              ...(opts.from ? { gte: startOfUtcDay(opts.from) } : {}),
              ...(opts.to ? { lte: startOfUtcDay(opts.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { startDate: 'desc' },
    take: opts.limit ?? undefined,
  });
  return periods.map(toDTO);
}

export async function getPeriod(userId: string, id: string): Promise<PeriodDTO> {
  const period = await getOwnedPeriodOrThrow(userId, id);
  return toDTO(period);
}

function assertRangeValid(startDate: Date, endDate: Date | null): void {
  if (endDate && endDate < startDate) {
    throw ApiError.validation('End date cannot be before the start date', [
      { field: 'endDate', message: 'End date cannot be before the start date' },
    ]);
  }
}

export async function createPeriod(
  userId: string,
  input: { startDate: string; endDate?: string | null; flow?: Flow; notes?: string | null },
): Promise<PeriodDTO> {
  const startDate = startOfUtcDay(input.startDate);
  const endDate = input.endDate ? startOfUtcDay(input.endDate) : null;
  assertRangeValid(startDate, endDate);

  // Reject exact duplicate start dates to avoid accidental double-logging.
  const clash = await prisma.period.findFirst({ where: { userId, startDate } });
  if (clash) {
    throw ApiError.conflict('You already have a period logged starting on that date');
  }

  const period = await prisma.period.create({
    data: {
      userId,
      startDate,
      endDate,
      flow: input.flow ?? 'MEDIUM',
      notes: input.notes ?? null,
    },
  });
  return toDTO(period);
}

export async function updatePeriod(
  userId: string,
  id: string,
  input: { startDate?: string; endDate?: string | null; flow?: Flow; notes?: string | null },
): Promise<PeriodDTO> {
  const existing = await getOwnedPeriodOrThrow(userId, id);

  const startDate =
    input.startDate !== undefined ? startOfUtcDay(input.startDate) : existing.startDate;
  const endDate =
    input.endDate === undefined
      ? existing.endDate
      : input.endDate === null
        ? null
        : startOfUtcDay(input.endDate);
  assertRangeValid(startDate, endDate);

  const updated = await prisma.period.update({
    where: { id },
    data: {
      startDate,
      endDate,
      ...(input.flow !== undefined ? { flow: input.flow } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  return toDTO(updated);
}

export async function deletePeriod(userId: string, id: string): Promise<void> {
  await getOwnedPeriodOrThrow(userId, id);
  await prisma.period.delete({ where: { id } });
}
