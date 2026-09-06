import { prisma } from '../config/database';

export interface ReminderDTO {
  periodReminder: boolean;
  periodReminderDaysBefore: number;
  symptomReminder: boolean;
  reminderTime: string;
  updatedAt: string;
}

function toDTO(r: {
  periodReminder: boolean;
  periodReminderDaysBefore: number;
  symptomReminder: boolean;
  reminderTime: string;
  updatedAt: Date;
}): ReminderDTO {
  return {
    periodReminder: r.periodReminder,
    periodReminderDaysBefore: r.periodReminderDaysBefore,
    symptomReminder: r.symptomReminder,
    reminderTime: r.reminderTime,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getReminderPreference(userId: string): Promise<ReminderDTO> {
  const pref = await prisma.reminderPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return toDTO(pref);
}

export async function updateReminderPreference(
  userId: string,
  input: Partial<{
    periodReminder: boolean;
    periodReminderDaysBefore: number;
    symptomReminder: boolean;
    reminderTime: string;
  }>,
): Promise<ReminderDTO> {
  const pref = await prisma.reminderPreference.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
  return toDTO(pref);
}
