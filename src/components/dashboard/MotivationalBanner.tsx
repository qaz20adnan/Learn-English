'use client';

import { useEffect, useState } from 'react';
import { DAILY_QUOTES } from '@/lib/content/quotes';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/cn';

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path
        d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9Z"
        fill="currentColor"
      />
      <path
        d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'next' | 'previous' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn('h-4 w-4', direction === 'previous' && 'rotate-180')}
      fill="none"
      aria-hidden
    >
      <path
        d="M7 4.5l5.5 5.5L7 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <rect x="5" y="4" width="3.2" height="12" rx="1" />
      <rect x="11.8" y="4" width="3.2" height="12" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M6 4.4v11.2a1 1 0 001.53.85l8-5.6a1 1 0 000-1.7l-8-5.6A1 1 0 006 4.4Z" />
    </svg>
  );
}

const controlClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-white';

export function MotivationalBanner() {
  const { dict } = useI18n();
  const t = dict.dashboard;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % DAILY_QUOTES.length);
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [playing]);

  const quote = DAILY_QUOTES[index] ?? DAILY_QUOTES[0];

  function step(direction: 1 | -1) {
    setIndex((value) => (value + direction + DAILY_QUOTES.length) % DAILY_QUOTES.length);
  }

  return (
    <section
      aria-label={t.quoteLabel}
      className="card relative overflow-hidden border-brand-300/30 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-2xl shadow-brand-700/20 sm:p-6"
    >
      <div
        aria-hidden
        className="absolute -end-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 start-1/3 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-inner">
          <SparkIcon />
        </span>

        <div key={index} className="quote-enter min-w-0" aria-live="polite">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {t.quoteLabel} · {t.quoteHint}
          </p>
          <p className="mt-1.5 text-base font-extrabold leading-relaxed sm:text-lg">
            {quote.ar}
          </p>
          <p
            dir="ltr"
            className="force-ltr mt-1 text-xs font-medium leading-relaxed text-white/75"
          >
            {quote.en}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t.previousQuote}
              title={t.previousQuote}
              className={controlClass}
            >
              <ArrowIcon direction="previous" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? t.pauseQuote : t.playQuote}
              title={playing ? t.pauseQuote : t.playQuote}
              className={controlClass}
            >
              <PlayPauseIcon playing={playing} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t.nextQuote}
              title={t.nextQuote}
              className={controlClass}
            >
              <ArrowIcon direction="next" />
            </button>
          </div>

          <div className="flex items-center gap-1.5" aria-hidden>
            {DAILY_QUOTES.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                tabIndex={-1}
                onClick={() => setIndex(dotIndex)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  dotIndex === index ? 'w-5 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
