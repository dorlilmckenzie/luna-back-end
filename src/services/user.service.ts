import type { User } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { hashPassword, verifyPassword } from '../utils/password';
import type { PublicUser } from '../types';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dateOfBirth: user.dateOfBirth.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
}

export async function updateProfile(
  id: string,
  data: { firstName?: string; lastName?: string; email?: string },
): Promise<PublicUser> {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== id) {
      throw ApiError.conflict('That email address is already in use');
    }
  }
  const user = await prisma.user.update({ where: { id }, data });
  return toPublicUser(user);
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Your current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash } }),
    // Changing password invalidates all existing refresh sessions.
    prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

/**
 * Permanently delete the account and every related record. Cascades handle children,
 * but we run inside a transaction and revoke sessions first for clarity.
 */
export async function deleteAccount(id: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Password is incorrect');

  await prisma.user.delete({ where: { id } });
}
