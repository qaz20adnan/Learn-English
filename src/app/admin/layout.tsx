import Link from 'next/link';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth/dal';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { HeaderFallback, SiteHeader } from '@/components/layout/SiteHeader';
import type { Dictionary } from '@/lib/i18n';

export const metadata = { title: 'لوحة الإدارة' };

function AdminNav({ dict }: { dict: Dictionary }) {
  return (
    <nav aria-label={dict.admin.title} className="flex flex-wrap items-center gap-1">
      <Link
        href="/admin"
        className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-ink-800"
      >
        🛡️ {dict.admin.overview}
      </Link>
      <Link
        href="/admin/users"
        className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-ink-800"
      >
        👥 {dict.admin.users}
      </Link>
      <Link
        href="/admin/media"
        className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-ink-800"
      >
        🎬 {dict.admin.media}
      </Link>
    </nav>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const { locale, dict } = await getLocaleAndDictionary();
  await requireAdmin();

  return (
    <LocaleProvider locale={locale}>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h1 className="text-lg font-black">{dict.admin.title}</h1>
              <p className="text-xs text-muted">{dict.admin.protected}</p>
            </div>
            <AdminNav dict={dict} />
          </div>
          <Suspense fallback={<div className="text-muted">{dict.admin.loading}</div>}>
            {children}
          </Suspense>
        </div>
      </main>
      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        {dict.admin.footer}
      </footer>
    </LocaleProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-6xl px-4 py-6">
            <div className="h-16 w-full animate-pulse rounded-2xl bg-ink-200 dark:bg-ink-800" />
          </div>
        }
      >
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
