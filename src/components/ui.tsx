import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={cn('card p-5', className)}>{children}</Tag>;
}

const badgeTones: Record<string, string> = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeTones[tone] ?? badgeTones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${safe}%`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-400 transition-[width] duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  emoji = '🗂️',
  icon,
  title,
  description,
  action,
}: {
  emoji?: string;
  /** Optional lucide icon rendered instead of the emoji (design-system D3). */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-900/40 dark:text-brand-300" aria-hidden>
          {icon}
        </span>
      ) : (
        <span className="text-4xl" aria-hidden>
          {emoji}
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  emoji,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  emoji?: string;
  /** Optional lucide icon rendered beside the label instead of an emoji. */
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon ? (
          <span className="text-brand-500 dark:text-brand-300" aria-hidden>
            {icon}
          </span>
        ) : emoji ? (
          <span aria-hidden>{emoji}</span>
        ) : null}
        {label}
      </span>
      <span className="text-2xl font-extrabold tracking-tight">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

const levelTones: Record<string, 'success' | 'info' | 'warning'> = {
  foundation: 'success',
  a1: 'success',
  a2: 'info',
  b1: 'info',
  b2: 'warning',
  c1: 'warning',
};

export function LevelBadge({ level, label }: { level: string; label?: string }) {
  return <Badge tone={levelTones[level] ?? 'neutral'}>{label ?? level}</Badge>;
}

/**
 * Loading placeholder block (Stage 2 — D4). Pure presentation; compose it into
 * page-shaped skeletons. Uses the `.skeleton` shimmer utility from globals.css.
 */
export function Skeleton({
  className,
  label,
}: {
  className?: string;
  /** Accessible name for meaningful loading regions. */
  label?: string;
}) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'status' : undefined}
    />
  );
}
