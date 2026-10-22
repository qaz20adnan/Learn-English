'use client';

import { useRef, useSyncExternalStore, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/cn';
import { useI18n } from '@/components/i18n/LocaleProvider';
import type { Dictionary } from '@/lib/i18n';

type ThemeName = 'system' | 'light' | 'dark' | 'emerald' | 'sepia' | 'midnight';
type ThemeCopyKey = keyof Dictionary['theme']['descriptions'];

interface ThemeOption {
  value: ThemeName;
  copyKey: ThemeCopyKey;
  swatch: string;
}

const OPTIONS: ThemeOption[] = [
  {
    value: 'system',
    copyKey: 'system',
    swatch: 'bg-[linear-gradient(135deg,#f8fafc_0_50%,#1e293b_50%_100%)]',
  },
  {
    value: 'light',
    copyKey: 'light',
    swatch: 'bg-[linear-gradient(135deg,#ffffff_0_45%,#6366f1_46%_100%)]',
  },
  {
    value: 'dark',
    copyKey: 'dark',
    swatch: 'bg-[linear-gradient(135deg,#0f172a_0_45%,#818cf8_46%_100%)]',
  },
  {
    value: 'emerald',
    copyKey: 'emerald',
    swatch: 'bg-[linear-gradient(135deg,#d1fae5_0_40%,#059669_41%_100%)]',
  },
  {
    value: 'sepia',
    copyKey: 'sepia',
    swatch: 'bg-[linear-gradient(135deg,#fef3c7_0_40%,#b45309_41%_100%)]',
  },
  {
    value: 'midnight',
    copyKey: 'midnight',
    swatch: 'bg-[linear-gradient(135deg,#07111f_0_42%,#22d3ee_43%_100%)]',
  },
];

const emptySubscribe = () => () => {};

/** True only after hydration, so server and client markup match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4.5 10.5l3.2 3.2 7.8-7.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M10 3.2a6.8 6.8 0 100 13.6c1 0 1.5-.6 1.5-1.4 0-.5-.2-.8-.5-1.2-.2-.3-.4-.6-.4-1 0-.7.5-1.2 1.2-1.2h1.5c2 0 3.5-1.5 3.5-3.4C16.8 5.6 13.7 3.2 10 3.2z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="7.2" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="6.4" r="1" fill="currentColor" />
      <circle cx="6.3" cy="11.2" r="1" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dict } = useI18n();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = (mounted ? theme : 'system') as ThemeName | undefined;
  const current = OPTIONS.find((option) => option.value === active) ?? OPTIONS[0];
  const currentLabel = dict.theme[current.copyKey];

  function choose(next: ThemeName) {
    setTheme(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${dict.theme.label}: ${currentLabel}`}
        title={dict.theme.choose}
        className="group flex items-center gap-2 rounded-xl border border-line surface px-2.5 py-2 text-sm font-bold transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-[0_10px_28px_-18px_var(--color-brand-500)]"
      >
        <span
          aria-hidden
          className={cn(
            'h-4 w-4 rounded-full ring-2 ring-white/70 shadow-sm dark:ring-ink-700',
            current.swatch,
          )}
        />
        <span className="hidden max-w-24 truncate text-xs text-muted transition group-hover:text-brand-600 xl:inline dark:group-hover:text-brand-300">
          {currentLabel}
        </span>
        <PaletteIcon />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label={dict.theme.choose}
            className="fixed end-3 top-[4.5rem] z-50 max-h-[min(70vh,32rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line surface p-2 shadow-2xl shadow-ink-950/20 sm:absolute sm:end-0 sm:top-[calc(100%+0.5rem)] sm:mt-0 sm:max-h-none sm:w-72"
          >
            <div className="px-3 py-2">
              <p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">
                {dict.theme.choose}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{dict.theme.label}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              {OPTIONS.map((option) => {
                const selected = current.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => choose(option.value)}
                    className={cn(
                      'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition',
                      selected
                        ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/35 dark:text-brand-100'
                        : 'hover:bg-brand-50/70 dark:hover:bg-ink-800',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 h-6 w-6 shrink-0 rounded-full ring-2 ring-white shadow-sm dark:ring-ink-800',
                        option.swatch,
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {dict.theme[option.copyKey]}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                        {dict.theme.descriptions[option.copyKey]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'mt-1 text-brand-600 transition dark:text-brand-300',
                        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                      )}
                    >
                      <CheckIcon />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
