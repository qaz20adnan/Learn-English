'use client';

import Link from 'next/link';
import { useId } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n';
import { useI18n } from '@/components/i18n/LocaleProvider';

export type NavKey = Exclude<keyof Dictionary['nav'], 'aria'>;

export interface NavItem {
  href: string;
  key: NavKey;
  emoji: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', emoji: '🏠' },
  { href: '/roadmap', key: 'roadmap', emoji: '🗺️' },
  { href: '/courses', key: 'courses', emoji: '📚' },
  { href: '/quizzes', key: 'quizzes', emoji: '📝' },
  { href: '/stories', key: 'stories', emoji: '📖' },
  { href: '/vocabulary', key: 'vocabulary', emoji: '🧠' },
  { href: '/review', key: 'review', emoji: '🔁' },
  { href: '/favorites', key: 'favorites', emoji: '⭐' },
  { href: '/progress', key: 'progress', emoji: '📈' },
];

export function MainNav({ items = MAIN_NAV }: { items?: NavItem[] }) {
  const pathname = usePathname();
  const navId = useId();
  const { dict } = useI18n();

  return (
    <nav
      aria-label={dict.nav.aria}
      className="flex items-center gap-1 overflow-x-auto pb-1 xl:overflow-visible xl:pb-0"
    >
      {items.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const label = dict.nav[item.key];
        const hint = dict.navHints[item.key];
        const hintId = `${navId}-${item.key}`;
        const edgeAlign =
          index === 0
            ? 'start-0'
            : index === items.length - 1
              ? 'end-0'
              : 'left-1/2 -translate-x-1/2';
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-describedby={hintId}
            className={cn(
              'group relative flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-[transform,color,background-color,box-shadow] duration-200 ease-out',
              'after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:origin-center after:scale-x-50 after:rounded-full after:bg-gradient-to-l after:from-brand-400 after:to-brand-600 after:opacity-0 after:transition-all after:duration-300',
              'hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_10px_26px_-18px_var(--color-brand-500)] hover:after:scale-x-100 hover:after:opacity-60',
              'focus-visible:after:scale-x-100 focus-visible:after:opacity-100',
              active
                ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/20 after:from-white/95 after:to-white/60 after:opacity-100 after:scale-x-100'
                : 'text-muted hover:bg-brand-50/80 hover:text-brand-700 dark:hover:bg-ink-800 dark:hover:text-brand-200',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md text-[11px] transition-transform duration-200 group-hover:scale-110 xl:hidden 2xl:flex',
                active
                  ? 'bg-white/15'
                  : 'bg-brand-50 text-brand-700 dark:bg-ink-800 dark:text-brand-200',
              )}
            >
              {item.emoji}
            </span>
            <span>{label}</span>
            <span
              id={hintId}
              role="tooltip"
              className={cn(
                'pointer-events-none absolute top-[calc(100%+0.55rem)] z-50 hidden w-max max-w-60 translate-y-1 rounded-xl border border-line bg-[var(--surface-raised)] px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-[var(--text)] opacity-0 shadow-xl shadow-ink-950/10 transition-all duration-200',
                edgeAlign,
                'group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100',
                'xl:group-hover:block xl:group-focus-visible:block',
              )}
            >
              {index > 0 && index < items.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-s border-t border-line bg-[var(--surface-raised)]"
                />
              ) : null}
              {hint}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
