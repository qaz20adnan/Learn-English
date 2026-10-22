'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, localeLabel, type Locale } from '@/lib/i18n';
import { setLocaleAction } from '@/lib/i18n/actions';
import { useI18n } from './LocaleProvider';
import { cn } from '@/lib/cn';

export function LanguageToggle() {
  const { locale, dict, setLocale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    // Instant: state, <html> direction and cookie are updated synchronously.
    setLocale(next);
    // Persist to the signed-in user's settings and refresh server-rendered text.
    startTransition(async () => {
      try {
        await setLocaleAction(next);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <div
      role="group"
      aria-label={dict.language.change}
      className="flex items-center gap-0.5 rounded-xl border border-line surface p-0.5"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          aria-pressed={locale === option}
          aria-label={localeLabel(option)}
          disabled={pending}
          className={cn(
            'rounded-lg px-2 py-1 text-xs font-bold transition disabled:opacity-60',
            locale === option
              ? 'bg-brand-600 text-white'
              : 'text-muted hover:text-brand-600',
          )}
        >
          <span aria-hidden className="sm:hidden">
            {option === 'ar' ? 'ع' : 'EN'}
          </span>
          <span className="hidden sm:inline">{localeLabel(option)}</span>
        </button>
      ))}
    </div>
  );
}
