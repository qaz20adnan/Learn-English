import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/dal';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { BrandLogo } from './BrandLogo';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';

export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 2xl:max-w-[90rem]">
        <span className="flex items-center gap-2.5 text-lg font-extrabold">
          <BrandLogo size="md" className="shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight">Fluently | فلوينتلي</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
              English Speaking Academy
            </span>
          </span>
        </span>
        <span className="hidden h-8 w-24 animate-pulse rounded-xl bg-ink-200 dark:bg-ink-800 sm:block" />
      </div>
    </header>
  );
}

export async function SiteHeader() {
  const [user, { dict }] = await Promise.all([getCurrentUser(), getLocaleAndDictionary()]);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 2xl:max-w-[90rem]">
        <Link
          href="/dashboard"
          aria-label={`${dict.common.appNameShort} — ${dict.common.brandLatin} · ${dict.common.brandTagline}`}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none"
        >
          <BrandLogo
            size="md"
            className="shrink-0 transition duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
          <span className="hidden min-w-0 flex-col leading-none min-[360px]:flex">
            <span className="truncate text-base font-black tracking-tight">
              {dict.common.appNameShort}
            </span>
            <span className="mt-0.5 hidden truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted sm:block">
              {dict.common.brandLatin} · {dict.common.brandTagline}
            </span>
          </span>
        </Link>

        <div className="hidden xl:block">
          <MainNav />
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold whitespace-nowrap text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              {dict.common.login}
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-line/70 bg-[var(--surface)]/40 px-3 py-2 xl:hidden">
        <MainNav />
      </div>
    </header>
  );
}
