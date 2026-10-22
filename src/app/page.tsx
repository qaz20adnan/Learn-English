import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { DeveloperCredit } from '@/components/layout/DeveloperCredit';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.landing.metaTitle, description: dict.landing.metaDescription };
}

function LandingFallback() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 text-lg font-extrabold">
          <BrandLogo size="md" />
          <span>Fluently | فلوينتلي</span>
        </div>
      </header>
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:pt-16">
        <div className="mx-auto h-10 w-64 animate-pulse rounded-xl bg-ink-200 dark:bg-ink-800" />
        <div className="mx-auto mt-4 h-28 w-full max-w-3xl animate-pulse rounded-2xl bg-ink-200 dark:bg-ink-800" />
      </section>
    </main>
  );
}

async function Landing() {
  const { locale, dict } = await getLocaleAndDictionary();

  return (
    <LocaleProvider locale={locale}>
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 start-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-32 -end-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl"
        />

        <header className="sticky top-0 z-30 border-b border-line/70 glass">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl text-lg font-extrabold"
            >
              <BrandLogo
                size="md"
                className="transition duration-300 group-hover:-rotate-6 group-hover:scale-105"
              />
              <span className="flex min-w-0 flex-col leading-none">
                <span className="truncate text-base font-black tracking-tight">
                  {dict.landing.brand}
                </span>
                <span className="mt-0.5 hidden truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted sm:block">
                  {dict.common.brandTagline}
                </span>
              </span>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:-translate-y-0.5 hover:text-brand-600 sm:inline-flex"
              >
                {dict.landing.signIn}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-bold whitespace-nowrap text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700 sm:px-4"
              >
                {dict.landing.startNow}
              </Link>
            </nav>
          </div>
        </header>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-10 text-center sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-brand-50/80 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm dark:border-brand-900/60 dark:bg-brand-950/30 dark:text-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            {dict.landing.badge}
          </p>
          <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            {dict.landing.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {dict.landing.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              {dict.landing.ctaRegister}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-line surface px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-brand-400"
            >
              {dict.landing.ctaLogin}
            </Link>
          </div>
        </section>

        <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {dict.landing.features.map((feature) => (
            <article
              key={feature.title}
              className="card group p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-300/70 hover:shadow-2xl hover:shadow-brand-500/10"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-2xl shadow-inner ring-1 ring-brand-200/60 transition duration-300 group-hover:scale-105 dark:from-brand-900/40 dark:to-ink-900 dark:ring-brand-800/60"
              >
                {feature.emoji}
              </span>
              <h2 className="mt-3 text-lg font-bold">{feature.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{feature.text}</p>
            </article>
          ))}
        </section>

        <footer className="relative mt-auto border-t border-line/80 px-4 py-7">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            <DeveloperCredit />
            <p className="border-t border-line/60 pt-3 text-center text-[11px] text-muted">
              {dict.landing.footer}
            </p>
          </div>
        </footer>
      </main>
    </LocaleProvider>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <Landing />
    </Suspense>
  );
}

