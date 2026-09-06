import type { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended';

// Replace the real Prisma client with a deep mock for every test that imports this file.
jest.mock('../src/config/database', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../src/config/database') as { prisma: DeepMockProxy<PrismaClient> };

export const prismaMock = prisma;

beforeEach(() => {
  mockReset(prismaMock);
});
