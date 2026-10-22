'use client';

import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import { useCookieLocale } from '@/components/i18n/useCookieLocale';
import { BrandLogo } from '@/components/layout/BrandLogo';

export default function NotFound() {
  const dict = getDictionary(useCookieLocale());
  const t = dict.notFound;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <BrandLogo size="lg" />
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
        Fluently | فلوينتلي
      </p>
      <h1 className="text-2xl font-black">{t.title}</h1>
      <p className="text-sm text-muted">{t.subtitle}</p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {t.toDashboard}
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
        >
          {t.toHome}
        </Link>
      </div>
    </div>
  );
}
