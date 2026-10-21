import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/dal';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';

export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden className="text-2xl">
            🧭
          </span>
          <span>English Journey Academy</span>
        </span>
        <span className="h-8 w-24 animate-pulse rounded-xl bg-ink-200 dark:bg-ink-800" />
      </div>
    </header>
  );
}

export async function SiteHeader() {
  const [user, { dict }] = await Promise.all([getCurrentUser(), getLocaleAndDictionary()]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden className="text-2xl">
            🧭
          </span>
          <span className="hidden sm:inline">{dict.common.appName}</span>
        </Link>

        <div className="hidden md:block">
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
              className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-bold text-white"
            >
              {dict.common.login}
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-line px-3 py-2 md:hidden">
        <MainNav />
      </div>
    </header>
  );
}
