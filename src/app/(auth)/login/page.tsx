import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { loginAction } from '../actions';

export const metadata: Metadata = { title: 'تسجيل الدخول' };

export default async function LoginPage() {
  const dict = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{dict.auth.loginTitle}</h1>
        <p className="text-sm text-muted">{dict.auth.loginSubtitle}</p>
      </header>
      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
