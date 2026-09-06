import type { Severity, SymptomType } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { startOfUtcDay } from '../utils/dates';

export interface SymptomDTO {
  id: string;
  date: string;
  type: SymptomType;
  severity: Severity;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(s: {
  id: string;
  date: Date;
  type: SymptomType;
  severity: Severity;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SymptomDTO {
  return {
    id: s.id,
    date: s.date.toISOString(),
    type: s.type,
    severity: s.severity,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

async function getOwnedOrThrow(userId: string, id: string) {
  const row = await prisma.symptomLog.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw ApiError.notFound('Symptom record not found');
  return row;
}

export async function listSymptoms(
  userId: string,
  opts: { from?: string; to?: string } = {},
): Promise<SymptomDTO[]> {
  const rows = await prisma.symptomLog.findMany({
    where: {
      userId,
      ...(opts.from || opts.to
        ? {
            date: {
              ...(opts.from ? { gte: startOfUtcDay(opts.from) } : {}),
              ...(opts.to ? { lte: startOfUtcDay(opts.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'desc' },
  });
  return rows.map(toDTO);
}

/** Creates one row per selected symptom type for the given date. */
export async function createSymptoms(
  userId: string,
  input: { date: string; types: SymptomType[]; severity?: Severity; notes?: string | null },
): Promise<SymptomDTO[]> {
  const date = startOfUtcDay(input.date);
  const severity = input.severity ?? 'MODERATE';

  const created = await prisma.$transaction(
    input.types.map((type) =>
      prisma.symptomLog.create({
        data: { userId, date, type, severity, notes: input.notes ?? null },
      }),
    ),
  );
  return created.map(toDTO);
}

export async function updateSymptom(
  userId: string,
  id: string,
  input: { date?: string; type?: SymptomType; severity?: Severity; notes?: string | null },
): Promise<SymptomDTO> {
  await getOwnedOrThrow(userId, id);
  const updated = await prisma.symptomLog.update({
    where: { id },
    data: {
      ...(input.date !== undefined ? { date: startOfUtcDay(input.date) } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.severity !== undefined ? { severity: input.severity } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  return toDTO(updated);
}

export async function deleteSymptom(userId: string, id: string): Promise<void> {
  await getOwnedOrThrow(userId, id);
  await prisma.symptomLog.delete({ where: { id } });
}
