import type { Mood } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { startOfUtcDay } from '../utils/dates';

export interface MoodDTO {
  id: string;
  date: string;
  mood: Mood;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(m: {
  id: string;
  date: Date;
  mood: Mood;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MoodDTO {
  return {
    id: m.id,
    date: m.date.toISOString(),
    mood: m.mood,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

async function getOwnedOrThrow(userId: string, id: string) {
  const row = await prisma.moodLog.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw ApiError.notFound('Mood record not found');
  return row;
}

export async function listMoods(
  userId: string,
  opts: { from?: string; to?: string } = {},
): Promise<MoodDTO[]> {
  const rows = await prisma.moodLog.findMany({
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

export async function createMood(
  userId: string,
  input: { date: string; mood: Mood; notes?: string | null },
): Promise<MoodDTO> {
  const row = await prisma.moodLog.create({
    data: { userId, date: startOfUtcDay(input.date), mood: input.mood, notes: input.notes ?? null },
  });
  return toDTO(row);
}

export async function updateMood(
  userId: string,
  id: string,
  input: { date?: string; mood?: Mood; notes?: string | null },
): Promise<MoodDTO> {
  await getOwnedOrThrow(userId, id);
  const updated = await prisma.moodLog.update({
    where: { id },
    data: {
      ...(input.date !== undefined ? { date: startOfUtcDay(input.date) } : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  return toDTO(updated);
}

export async function deleteMood(userId: string, id: string): Promise<void> {
  await getOwnedOrThrow(userId, id);
  await prisma.moodLog.delete({ where: { id } });
}
