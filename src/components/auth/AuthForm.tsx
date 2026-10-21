'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { AuthState } from '@/app/(auth)/actions';
import { useI18n } from '@/components/i18n/LocaleProvider';

interface Props {
  mode: 'login' | 'register';
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isRegister = mode === 'register';
  const { dict } = useI18n();
  const t = dict.auth;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.errorKey ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
        >
          {t[state.errorKey]}
        </p>
      ) : null}

      {isRegister ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.name}</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            minLength={2}
            maxLength={80}
            placeholder={t.namePlaceholder}
            className="rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          placeholder="you@example.com"
          className="force-ltr rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          dir="ltr"
          placeholder="••••••••"
          className="force-ltr rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500"
        />
        {isRegister ? <span className="text-xs text-muted">{t.passwordHint}</span> : null}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? dict.common.processing : isRegister ? t.createAccount : t.signIn}
      </button>

      <p className="text-center text-sm text-muted">
        {isRegister ? `${t.haveAccount} ` : `${t.noAccount} `}
        <Link
          href={isRegister ? '/login' : '/register'}
          className="font-semibold text-brand-600 hover:underline dark:text-brand-300"
        >
          {isRegister ? t.signIn : t.createAccount}
        </Link>
      </p>
    </form>
  );
}
