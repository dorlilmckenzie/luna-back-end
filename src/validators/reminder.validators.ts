import { z } from 'zod';

export const updateReminderSchema = z
  .object({
    periodReminder: z.boolean().optional(),
    periodReminderDaysBefore: z.number().int().min(0).max(10).optional(),
    symptomReminder: z.boolean().optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm format')
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });
