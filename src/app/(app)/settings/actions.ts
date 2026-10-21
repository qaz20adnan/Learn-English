'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth/dal';
import { updateSettings } from '@/lib/db/queries';
import { settingsSchema } from '@/lib/validation';
import { LOCALE_COOKIE } from '@/lib/i18n';

export interface SettingsState {
  ok?: boolean;
  errorKey?: 'invalidValues';
}

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse({
    dailyGoalMinutes: Number(formData.get('dailyGoalMinutes')),
    uiLanguage: formData.get('uiLanguage'),
  });
  if (!parsed.success) {
    return { errorKey: 'invalidValues' };
  }

  updateSettings(user.id, parsed.data);

  // Keep the interface-language cookie in sync so the whole shell updates.
  if (parsed.data.uiLanguage) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, parsed.data.uiLanguage, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    revalidatePath('/', 'layout');
  }

  revalidatePath('/settings');
  return { ok: true };
}
