import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { HeaderFallback, SiteHeader } from '@/components/layout/SiteHeader';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

function PageFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-ink-200 dark:bg-ink-800" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-ink-200 dark:bg-ink-800" />
    </div>
  );
}

function ShellFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderFallback />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <PageFallback />
      </main>
    </div>
  );
}

async function AppChrome({ children }: { children: ReactNode }) {
  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <LocaleProvider locale={locale}>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </main>
      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        {dict.common.appName} · {dict.common.footerNote}
      </footer>
    </LocaleProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<ShellFallback />}>
        <AppChrome>{children}</AppChrome>
      </Suspense>
    </div>
  );
}
