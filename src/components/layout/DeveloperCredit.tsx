import { cn } from '@/lib/cn';
import { BrandLogo } from './BrandLogo';

/**
 * Bilingual developer attribution. Used once per page: in the global footers
 * (app/auth/admin layouts) and on the public homepage. The per-page card
 * duplicates in dashboard/settings were removed in Sprint 0 (T6) — the layout
 * footer already renders the credit on every page.
 */
export function DeveloperCredit({
  variant = 'footer',
  className,
}: {
  variant?: 'footer' | 'card';
  className?: string;
}) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'card relative overflow-hidden p-5',
          'border-brand-200/70 dark:border-brand-900/60',
          className,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-l from-brand-500/10 via-transparent to-amber-400/10"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <BrandLogo size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
              Crafted with care
            </p>
            <p className="mt-1 text-sm font-extrabold">تطوير وتصميم: م. عدنان القاضي</p>
            <p dir="ltr" className="force-ltr mt-0.5 text-xs text-muted">
              Developed with passion by Eng. Adnan Al-Qadi
            </p>
          </div>
          <span
            aria-hidden
            className="text-xl text-brand-500/70 dark:text-brand-300/80"
          >
            ✦
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-start',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <BrandLogo size="xs" />
        <p className="text-xs font-semibold text-muted">
          تطوير وتصميم:{' '}
          <span className="text-brand-700 dark:text-brand-300">م. عدنان القاضي</span>
        </p>
      </div>
      <p dir="ltr" className="force-ltr text-[11px] text-muted">
        Developed with passion by Eng. Adnan Al-Qadi
      </p>
    </div>
  );
}
