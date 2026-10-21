'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/components/i18n/LocaleProvider';

type Theme = 'system' | 'light' | 'dark';

const options: { value: Theme; key: 'light' | 'dark' | 'system'; emoji: string }[] = [
  { value: 'light', key: 'light', emoji: '☀️' },
  { value: 'dark', key: 'dark', emoji: '🌙' },
  { value: 'system', key: 'system', emoji: '💻' },
];

const emptySubscribe = () => () => {};

/** True only after hydration, so the server and client markup match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dict } = useI18n();
  const mounted = useMounted();

  const active = mounted ? theme : undefined;

  return (
    <div
      role="group"
      aria-label={dict.theme.label}
      className="flex items-center gap-0.5 rounded-xl border border-line surface p-0.5"
    >
      {options.map((option) => {
        const label = dict.theme[option.key];
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={active === option.value}
            title={label}
            className={
              active === option.value
                ? 'rounded-lg bg-brand-600 px-2 py-1 text-xs text-white'
                : 'rounded-lg px-2 py-1 text-xs text-muted transition hover:text-brand-600'
            }
          >
            <span aria-hidden>{option.emoji}</span>
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
