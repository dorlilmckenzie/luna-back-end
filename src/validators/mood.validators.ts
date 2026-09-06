import { z } from 'zod';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date');

const mood = z.enum([
  'HAPPY',
  'CALM',
  'ENERGETIC',
  'NEUTRAL',
  'SAD',
  'IRRITATED',
  'ANXIOUS',
  'TIRED',
]);

export const createMoodSchema = z.object({
  date: isoDate.refine(
    (v) => new Date(v).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
    'Date cannot be in the future',
  ),
  mood,
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateMoodSchema = z
  .object({
    date: isoDate.optional(),
    mood: mood.optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });

export const listMoodsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});
