import { prismaMock } from './prismaMock';
import * as authService from '../src/services/auth.service';
import { ApiError } from '../src/utils/apiError';
import { hashPassword } from '../src/utils/password';

const baseUser = {
  id: 'user-1',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@example.com',
  dateOfBirth: new Date('1998-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('auth.service.register', () => {
  it('rejects a duplicate email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: 'x' } as never);
    await expect(
      authService.register({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        password: 'Password123',
        dateOfBirth: '1998-01-01',
      }),
    ).rejects.toThrow(ApiError);
  });

  it('hashes the password and returns tokens + a sanitised user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, passwordHash: 'hashed' } as never);
    prismaMock.session.create.mockResolvedValue({} as never);

    const result = await authService.register({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'Password123',
      dateOfBirth: '1998-01-01',
    });

    // The password passed to prisma.user.create must be a hash, never the plaintext.
    const createArg = prismaMock.user.create.mock.calls[0][0] as { data: { passwordHash: string } };
    expect(createArg.data.passwordHash).not.toBe('Password123');
    expect(createArg.data.passwordHash.startsWith('$2')).toBe(true);

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.email).toBe('demo@example.com');
  });
});

describe('auth.service.login', () => {
  it('rejects invalid credentials with a generic error', async () => {
    const passwordHash = await hashPassword('Password123');
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash } as never);

    await expect(
      authService.login({ email: 'demo@example.com', password: 'WrongPassword1' }),
    ).rejects.toThrow(/email or password is incorrect/i);
  });

  it('rejects an unknown email with the same generic error', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'nobody@example.com', password: 'Password123' }),
    ).rejects.toThrow(/email or password is incorrect/i);
  });

  it('returns tokens on valid credentials and never leaks the hash', async () => {
    const passwordHash = await hashPassword('Password123');
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash } as never);
    prismaMock.session.create.mockResolvedValue({} as never);

    const result = await authService.login({
      email: 'demo@example.com',
      password: 'Password123',
    });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
