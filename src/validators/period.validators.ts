import { z } from 'zod';

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date');

const notInFuture = (v: string) => new Date(v).getTime() <= Date.now() + 24 * 60 * 60 * 1000;

const flow = z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'VERY_HEAVY']);

export const createPeriodSchema = z
  .object({
    startDate: isoDate.refine(notInFuture, 'Start date cannot be in the future'),
    endDate: isoDate.optional().nullable(),
    flow: flow.default('MEDIUM'),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date cannot be before the start date', path: ['endDate'] },
  )
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const days =
        (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (24 * 60 * 60 * 1000);
      return days <= 15;
    },
    { message: 'A period longer than 15 days looks unlikely — please check the dates', path: ['endDate'] },
  );

export const updatePeriodSchema = z
  .object({
    startDate: isoDate.refine(notInFuture, 'Start date cannot be in the future').optional(),
    endDate: isoDate.optional().nullable(),
    flow: flow.optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid identifier'),
});

export const listPeriodsQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
