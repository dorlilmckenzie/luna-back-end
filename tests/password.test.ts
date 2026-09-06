import { hashPassword, verifyPassword } from '../src/utils/password';

describe('password hashing', () => {
  it('produces a bcrypt hash that is not the plaintext', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('Password123');
    await expect(verifyPassword('Password123', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Password123');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces different hashes for the same input (salted)', async () => {
    const a = await hashPassword('Password123');
    const b = await hashPassword('Password123');
    expect(a).not.toBe(b);
  });
});
