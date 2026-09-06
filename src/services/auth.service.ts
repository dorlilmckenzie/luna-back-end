import { prisma } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  durationToMs,
  generateOpaqueToken,
  generateRefreshToken,
  hashToken,
  signAccessToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../config/logger';
import { sendPasswordResetEmail } from './email.service';
import { toPublicUser } from './user.service';
import type { PublicUser } from '../types';

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueSession(
  userId: string,
  email: string,
  userAgent?: string,
): Promise<Omit<AuthResult, 'user'>> {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = generateRefreshToken(userId);
  const expiresAt = new Date(Date.now() + durationToMs(env.REFRESH_TOKEN_EXPIRES_IN));

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      userAgent: userAgent?.slice(0, 255),
      expiresAt,
    },
  });

  return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  userAgent?: string;
}): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('An account with that email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      dateOfBirth: new Date(input.dateOfBirth),
      reminderPreference: { create: {} },
    },
  });

  const session = await issueSession(user.id, user.email, input.userAgent);
  return { user: toPublicUser(user), ...session };
}

export async function login(input: {
  email: string;
  password: string;
  userAgent?: string;
}): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same error whether the email exists or not, to avoid user enumeration.
  const genericError = ApiError.unauthorized('Your email or password is incorrect');
  if (!user) {
    // Spend roughly the same time as a real verify to blunt timing analysis.
    await hashPassword(input.password).catch(() => undefined);
    throw genericError;
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw genericError;

  const session = await issueSession(user.id, user.email, input.userAgent);
  return { user: toPublicUser(user), ...session };
}

export async function refresh(rawRefreshToken: string): Promise<Omit<AuthResult, 'user'>> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const session = await prisma.session.findUnique({ where: { tokenHash } });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized();

  // Rotate: revoke the old session, issue a new one.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(user.id, user.email, session.userAgent ?? undefined);
}

export async function logout(rawRefreshToken?: string): Promise<void> {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Do not reveal whether the account exists.
  if (!user) {
    logger.info('Password reset requested for unknown email (no-op)');
    return;
  }

  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password`;
  await sendPasswordResetEmail(user.email, rawToken, resetUrl);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('This password reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all sessions on password reset.
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
