import { cookies, headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import {
  createSession,
  deleteExpiredSessions,
  deleteSession,
  findSession,
  findUserById,
} from '../db/queries';
import type { PublicUser } from '../types';

export const SESSION_COOKIE = 'eja_session';
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function ttlDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Only mark the session cookie `Secure` when the request actually arrives over
 * HTTPS. Forcing it in production breaks plain-HTTP deployments (localhost and
 * LAN servers), where browsers silently drop a `Secure` cookie — which would
 * make every protected page bounce back to /login.
 *
 * `SESSION_COOKIE_SECURE` can override the detection ('true' | 'false').
 */
async function isSecureRequest(): Promise<boolean> {
  const override = process.env.SESSION_COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;

  const store = await headers();
  const proto = store.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto === 'https';
}

/**
 * Creates a DB-backed session and writes the opaque token to an httpOnly cookie.
 * Must be called from a Server Action or Route Handler (never during render).
 */
export async function startSession(userId: string, userAgent?: string | null): Promise<void> {
  await deleteExpiredSessions();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = ttlDate(SESSION_TTL_DAYS);
  await createSession({ userId, tokenHash: hashToken(token), expiresAt: expiresAt.toISOString(), userAgent });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: '/',
    expires: expiresAt,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Reads the current session cookie and resolves the matching user, if valid. */
export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await findSession(hashToken(token));
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await deleteSession(hashToken(token));
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Deletes the session row and clears the cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(hashToken(token));
  }
  store.delete(SESSION_COOKIE);
}
