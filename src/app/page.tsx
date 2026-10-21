import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.landing.metaTitle };
}

function LandingFallback() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden className="text-2xl">
            🧭
          </span>
          <span>English Journey Academy</span>
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
  const { dict } = await getLocaleAndDictionary();

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden className="text-2xl">
            🧭
          </span>
          <span>{dict.landing.brand}</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:text-brand-600"
          >
            {dict.landing.signIn}
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {dict.landing.startNow}
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 text-center sm:pt-16">
        <p className="mb-3 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
          {dict.landing.badge}
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          {dict.landing.heroTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          {dict.landing.heroSubtitle}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {dict.landing.ctaRegister}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line surface px-6 py-3 text-sm font-bold transition hover:border-brand-400"
          >
            {dict.landing.ctaLogin}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {dict.landing.features.map((feature) => (
          <article key={feature.title} className="card p-5">
            <span className="text-2xl" aria-hidden>
              {feature.emoji}
            </span>
            <h2 className="mt-2 text-lg font-bold">{feature.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{feature.text}</p>
          </article>
        ))}
      </section>

      <footer className="mt-auto border-t border-line px-4 py-6 text-center text-xs text-muted">
        {dict.landing.footer}
      </footer>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <Landing />
    </Suspense>
  );
}

