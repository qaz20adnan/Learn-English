import { redirect } from 'next/navigation';
import { getSessionUser } from './session';
import type { PublicUser } from '../types';

/**
 * Central data access layer for authorization.
 *
 * Every server-side read of the current user goes through here so that
 * authorization is enforced in exactly one place. UI checks (hiding links,
 * conditional rendering) are complementary, never a substitute.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  return getSessionUser();
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  return user;
}
