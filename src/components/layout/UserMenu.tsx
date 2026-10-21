'use client';

import Link from 'next/link';
import { useState } from 'react';
import { logoutAction } from '@/app/(auth)/actions';
import type { PublicUser } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useI18n } from '@/components/i18n/LocaleProvider';

export function UserMenu({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const { dict } = useI18n();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-line surface px-2.5 py-1.5 text-sm font-semibold transition hover:border-brand-400"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
        >
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{user.name}</span>
        {user.role === 'ADMIN' ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            {dict.common.adminBadge}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute end-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line surface shadow-lg"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p dir="ltr" className="force-ltr truncate text-xs text-muted">
                {user.email}
              </p>
            </div>
            <div className="flex flex-col py-1 text-sm">
              <Link
                href="/settings"
                className="px-4 py-2 transition hover:bg-brand-50 dark:hover:bg-ink-800"
                onClick={() => setOpen(false)}
              >
                ⚙️ {dict.common.settings}
              </Link>
              {user.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className="px-4 py-2 transition hover:bg-brand-50 dark:hover:bg-ink-800"
                  onClick={() => setOpen(false)}
                >
                  🛡️ {dict.common.adminPanel}
                </Link>
              ) : null}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={cn(
                    'w-full px-4 py-2 text-start text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-ink-800',
                  )}
                >
                  ⏏️ {dict.common.logout}
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
