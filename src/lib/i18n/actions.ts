'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/auth/session';
import { updateSettings } from '@/lib/db/queries';
import { LOCALE_COOKIE, resolveLocale } from './index';

/**
 * Persists the interface language to a cookie (always) and to the signed-in
 * user's settings row (when authenticated), then revalidates the shell.
 */
export async function setLocaleAction(next: string): Promise<void> {
  const locale = resolveLocale(next);

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const user = await getSessionUser();
  if (user) {
    await updateSettings(user.id, { uiLanguage: locale });
  }

  revalidatePath('/', 'layout');
}
