import { prismaMock } from './prismaMock';
import * as periodService from '../src/services/period.service';
import { ApiError } from '../src/utils/apiError';

const ownPeriod = {
  id: '11111111-1111-1111-1111-111111111111',
  userId: 'user-1',
  startDate: new Date('2026-08-01'),
  endDate: new Date('2026-08-05'),
  flow: 'MEDIUM' as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('period.service authorization', () => {
  it('getPeriod returns 404 when the record belongs to another user', async () => {
    prismaMock.period.findUnique.mockResolvedValue({ ...ownPeriod, userId: 'someone-else' } as never);
    await expect(periodService.getPeriod('user-1', ownPeriod.id)).rejects.toThrow(ApiError);
    await expect(periodService.getPeriod('user-1', ownPeriod.id)).rejects.toThrow(/not found/i);
  });

  it('getPeriod returns the record for its owner', async () => {
    prismaMock.period.findUnique.mockResolvedValue(ownPeriod as never);
    const dto = await periodService.getPeriod('user-1', ownPeriod.id);
    expect(dto.id).toBe(ownPeriod.id);
    expect(dto.flow).toBe('MEDIUM');
  });

  it('updatePeriod refuses to touch another user\'s record', async () => {
    prismaMock.period.findUnique.mockResolvedValue({ ...ownPeriod, userId: 'other' } as never);
    await expect(
      periodService.updatePeriod('user-1', ownPeriod.id, { flow: 'HEAVY' }),
    ).rejects.toThrow(/not found/i);
    expect(prismaMock.period.update).not.toHaveBeenCalled();
  });

  it('deletePeriod refuses to delete another user\'s record', async () => {
    prismaMock.period.findUnique.mockResolvedValue({ ...ownPeriod, userId: 'other' } as never);
    await expect(periodService.deletePeriod('user-1', ownPeriod.id)).rejects.toThrow(/not found/i);
    expect(prismaMock.period.delete).not.toHaveBeenCalled();
  });
});

describe('period.service validation', () => {
  it('rejects an end date before the start date', async () => {
    await expect(
      periodService.createPeriod('user-1', { startDate: '2026-08-10', endDate: '2026-08-01' }),
    ).rejects.toThrow(/end date cannot be before/i);
  });

  it('rejects a duplicate start date', async () => {
    prismaMock.period.findFirst.mockResolvedValue(ownPeriod as never);
    await expect(
      periodService.createPeriod('user-1', { startDate: '2026-08-01' }),
    ).rejects.toThrow(/already have a period/i);
  });

  it('creates a period for a valid payload', async () => {
    prismaMock.period.findFirst.mockResolvedValue(null);
    prismaMock.period.create.mockResolvedValue(ownPeriod as never);
    const dto = await periodService.createPeriod('user-1', {
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      flow: 'MEDIUM',
    });
    expect(dto.id).toBe(ownPeriod.id);
    expect(prismaMock.period.create).toHaveBeenCalledTimes(1);
  });
});
