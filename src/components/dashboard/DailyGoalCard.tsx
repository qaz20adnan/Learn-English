import { Target } from 'lucide-react';
import type { DailyProgress } from '@/lib/db/queries';
import type { Dictionary } from '@/lib/i18n';

/**
 * Dashboard element #3 — daily progress against `daily_goal_minutes`
 * (Sprint 5, 3.1). Pure server component: an SVG progress ring, no JS.
 */
export function DailyGoalCard({
  progress,
  dict,
}: {
  progress: DailyProgress;
  dict: Dictionary;
}) {
  const t = dict.dashboard;
  const percent = Math.max(0, Math.min(100, progress.percent));
  const done = percent >= 100;

  // SVG ring: circumference of r=26 is ~163.4; stroke-dashoffset follows percent.
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - percent / 100);

  return (
    <section
      aria-label={t.dailyGoalTitle}
      className="card flex items-center gap-4 p-5"
      data-testid="daily-goal-card"
    >
      <div className="relative shrink-0" aria-hidden>
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth="7"
            className="stroke-ink-200 dark:stroke-ink-800"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className={done ? 'stroke-emerald-500' : 'stroke-brand-500'}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">
          {percent}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Target className="size-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
          {t.dailyGoalTitle}
        </p>
        <p className="mt-0.5 text-lg font-extrabold">
          {done ? t.dailyGoalDone : t.dailyGoalOf(progress.minutesToday, progress.goalMinutes)}
        </p>
        <p className="text-xs text-muted">
          {t.lessonsToday(progress.lessonsTouchedToday)}
          {' · '}
          {t.completedToday(progress.completedToday)}
        </p>
      </div>
    </section>
  );
}
