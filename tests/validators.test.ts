import { registerSchema, loginSchema } from '../src/validators/auth.validators';
import { createPeriodSchema } from '../src/validators/period.validators';

describe('auth validators', () => {
  it('rejects a weak password', () => {
    const result = registerSchema.safeParse({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      password: 'weak',
      confirmPassword: 'weak',
      dateOfBirth: '1998-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched password confirmation', () => {
    const result = registerSchema.safeParse({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      password: 'Password123',
      confirmPassword: 'Password124',
      dateOfBirth: '1998-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ADA@Example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      dateOfBirth: '1998-01-01',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('ada@example.com');
  });

  it('login requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('period validators', () => {
  it('rejects a future start date', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(createPeriodSchema.safeParse({ startDate: future }).success).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    const result = createPeriodSchema.safeParse({
      startDate: '2026-08-10',
      endDate: '2026-08-01',
    });
    expect(result.success).toBe(false);
  });

  it('defaults flow to MEDIUM', () => {
    const result = createPeriodSchema.safeParse({ startDate: '2026-08-01' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.flow).toBe('MEDIUM');
  });
});
