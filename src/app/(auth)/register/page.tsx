import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { registerAction } from '../actions';

export const metadata: Metadata = { title: 'إنشاء حساب' };

export default async function RegisterPage() {
  const dict = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{dict.auth.registerTitle}</h1>
        <p className="text-sm text-muted">{dict.auth.registerSubtitle}</p>
      </header>
      <AuthForm mode="register" action={registerAction} />
    </div>
  );
}
