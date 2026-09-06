import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

// A single shared Prisma client. This module is the backend's only gateway to PostgreSQL.
export const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['error', 'warn'],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
