import Link from 'next/link';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { DeveloperCredit } from '@/components/layout/DeveloperCredit';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

function AuthFallback() {
  return (
    <>
      <Link
        href="/"
        className="mb-6 flex items-center justify-center gap-2.5 text-lg font-extrabold"
      >
        <BrandLogo size="md" />
        <span className="flex flex-col leading-none">
          <span className="text-base font-black tracking-tight">Fluently | فلوينتلي</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
            English Speaking Academy
          </span>
        </span>
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
        className="group mb-6 flex items-center justify-center gap-2.5 text-lg font-extrabold"
      >
        <BrandLogo
          size="md"
          className="transition duration-300 group-hover:-rotate-6 group-hover:scale-105"
        />
        <span className="flex flex-col leading-none">
          <span className="text-base font-black tracking-tight">{dict.common.appNameShort}</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
            {dict.common.brandLatin} · {dict.common.brandTagline}
          </span>
        </span>
      </Link>
      <div className="card p-6 sm:p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-muted">{dict.auth.footer}</p>
      <DeveloperCredit className="mt-5" />
    </LocaleProvider>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-[var(--surface)] to-brand-100/70 px-4 py-10 dark:from-ink-950 dark:via-[var(--surface)] dark:to-ink-900">
      <div className="w-full max-w-md">
        <Suspense fallback={<AuthFallback />}>
          <AuthChrome>{children}</AuthChrome>
        </Suspense>
      </div>
    </div>
  );
}
