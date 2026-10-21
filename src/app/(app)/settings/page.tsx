import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getSettings } from '@/lib/db/queries';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { Card, SectionTitle } from '@/components/ui';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { updateSettingsAction } from './actions';

export const metadata: Metadata = { title: 'الإعدادات' };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = getSettings(user.id);
  const { dict } = await getLocaleAndDictionary();
  const t = dict.settings;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t.title} description={t.description} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h3 className="font-bold">{t.learning}</h3>
          <SettingsForm action={updateSettingsAction} initial={settings} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3">
            <h3 className="font-bold">{t.appearance}</h3>
            <p className="text-sm text-muted">{t.appearanceHint}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <h3 className="font-bold">{t.account}</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{dict.auth.name}</dt>
                <dd className="font-semibold">{user.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{dict.auth.email}</dt>
                <dd dir="ltr" className="force-ltr font-semibold">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t.role}</dt>
                <dd className="font-semibold">
                  {user.role === 'ADMIN' ? dict.common.adminBadge : dict.common.studentBadge}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
