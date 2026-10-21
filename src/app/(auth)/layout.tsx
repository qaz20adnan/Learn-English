import Link from 'next/link';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

function AuthFallback() {
  return (
    <>
      <Link
        href="/"
        className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold"
      >
        <span aria-hidden className="text-2xl">
          🧭
        </span>
        <span>English Journey Academy</span>
      </Link>
      <div className="card flex flex-col gap-4 p-6 sm:p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-ink-200 dark:bg-ink-800" />
        <div className="h-4 w-64 animate-pulse rounded bg-ink-200 dark:bg-ink-800" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-ink-200 dark:bg-ink-800" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-ink-200 dark:bg-ink-800" />
      </div>
    </>
  );
}

async function AuthChrome({ children }: { children: ReactNode }) {
  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <LocaleProvider locale={locale}>
      <Link
        href="/"
        className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold"
      >
        <span aria-hidden className="text-2xl">
          🧭
        </span>
        <span>{dict.common.appName}</span>
      </Link>
      <div className="card p-6 sm:p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-muted">{dict.auth.footer}</p>
    </LocaleProvider>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-10 dark:from-ink-950 dark:via-ink-950 dark:to-ink-900">
      <div className="w-full max-w-md">
        <Suspense fallback={<AuthFallback />}>
          <AuthChrome>{children}</AuthChrome>
        </Suspense>
      </div>
    </div>
  );
}
