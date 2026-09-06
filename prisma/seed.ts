/**
 * Development seed. Creates two demo accounts with synthetic cycle history.
 * NO real user data. Safe to run repeatedly (it upserts by email).
 *
 *   npm run seed
 *
 * Demo login:  demo@periodtracker.dev  /  Password123
 */
import { PrismaClient, Flow, SymptomType, Severity, Mood } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Date(utc.getTime() - n * MS_PER_DAY);
}

async function seedUser(opts: {
  email: string;
  firstName: string;
  lastName: string;
  cycleLengths: number[];
  periodLength: number;
}) {
  const passwordHash = await bcrypt.hash('Password123', 12);
  const user = await prisma.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      firstName: opts.firstName,
      lastName: opts.lastName,
      passwordHash,
      dateOfBirth: new Date('1997-06-15'),
      reminderPreference: { create: { periodReminder: true, symptomReminder: true } },
    },
  });

  // Clear any previous synthetic data for a clean re-seed.
  await prisma.period.deleteMany({ where: { userId: user.id } });
  await prisma.symptomLog.deleteMany({ where: { userId: user.id } });
  await prisma.moodLog.deleteMany({ where: { userId: user.id } });

  // Walk backwards from "most recent period ~10 days ago" through the cycle history.
  let cursor = 10;
  const periods: { startDate: Date; endDate: Date; flow: Flow }[] = [];
  for (const cycleLength of opts.cycleLengths) {
    const startDate = daysAgo(cursor);
    const endDate = daysAgo(cursor - (opts.periodLength - 1));
    periods.push({ startDate, endDate, flow: Flow.MEDIUM });
    cursor += cycleLength;
  }

  for (const p of periods) {
    await prisma.period.create({
      data: {
        userId: user.id,
        startDate: p.startDate,
        endDate: p.endDate,
        flow: p.flow,
        notes: null,
      },
    });
  }

  // A few symptoms and moods around the most recent period.
  await prisma.symptomLog.createMany({
    data: [
      { userId: user.id, date: daysAgo(11), type: SymptomType.CRAMPS, severity: Severity.MODERATE },
      { userId: user.id, date: daysAgo(11), type: SymptomType.FATIGUE, severity: Severity.MILD },
      { userId: user.id, date: daysAgo(10), type: SymptomType.BLOATING, severity: Severity.MODERATE },
    ],
  });
  await prisma.moodLog.createMany({
    data: [
      { userId: user.id, date: daysAgo(11), mood: Mood.IRRITATED, notes: null },
      { userId: user.id, date: daysAgo(9), mood: Mood.CALM, notes: null },
      { userId: user.id, date: daysAgo(3), mood: Mood.HAPPY, notes: null },
    ],
  });

  return user.email;
}

async function main() {
  const a = await seedUser({
    email: 'demo@periodtracker.dev',
    firstName: 'Demo',
    lastName: 'User',
    cycleLengths: [29, 28, 30, 27, 28, 31],
    periodLength: 5,
  });
  const b = await seedUser({
    email: 'ava@periodtracker.dev',
    firstName: 'Ava',
    lastName: 'Rivera',
    cycleLengths: [26, 25, 27, 26],
    periodLength: 4,
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo accounts (password "Password123"):\n  - ${a}\n  - ${b}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
