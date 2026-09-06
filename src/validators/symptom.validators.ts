import { z } from 'zod';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date');

const symptomType = z.enum([
  'CRAMPS',
  'HEADACHE',
  'BLOATING',
  'ACNE',
  'FATIGUE',
  'BACK_PAIN',
  'MOOD_CHANGES',
  'BREAST_TENDERNESS',
  'NAUSEA',
  'OTHER',
]);

const severity = z.enum(['MILD', 'MODERATE', 'SEVERE']);

export const createSymptomSchema = z.object({
  date: isoDate.refine(
    (v) => new Date(v).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
    'Date cannot be in the future',
  ),
  // Allow logging several symptoms for the same day in one request.
  types: z.array(symptomType).min(1, 'Select at least one symptom').max(10),
  severity: severity.default('MODERATE'),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateSymptomSchema = z
  .object({
    date: isoDate.optional(),
    type: symptomType.optional(),
    severity: severity.optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });

export const listSymptomsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});
