'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n';
import { useI18n } from '@/components/i18n/LocaleProvider';

export type NavKey = keyof Dictionary['nav'] & string;

export interface NavItem {
  href: string;
  key: NavKey;
  emoji: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', emoji: '🏠' },
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
  const { dict } = useI18n();

  return (
    <nav
      aria-label={dict.nav.aria}
      className="flex items-center gap-1 overflow-x-auto"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
              active
                ? 'bg-brand-600 text-white'
                : 'text-muted hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-ink-800',
            )}
          >
            <span aria-hidden>{item.emoji}</span>
            <span>{dict.nav[item.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
