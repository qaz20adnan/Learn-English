import type { PointsSummary } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { levelForPoints } from '@/lib/points';
import { ProgressBar, StatCard } from '@/components/ui';

export function PointsOverview({ summary, dict }: { summary: PointsSummary; dict: Dictionary }) {
  const t = dict.points;
  const levelLabel = t.levels[summary.levelKey as keyof typeof t.levels] ?? summary.levelKey;
  const progress = levelForPoints(summary.total).progress;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard emoji="🏅" label={t.total} value={summary.total} />
        <StatCard emoji="🎖️" label={t.level} value={levelLabel} />
        <StatCard emoji="🔥" label={t.streak} value={t.streakValue(summary.streak)} />
      </div>
      <div className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-bold">
            {t.level}: {levelLabel}
          </span>
          <span className="text-muted">
            {summary.nextLevelAt === null ? t.topLevel : t.nextLevel(summary.nextLevelAt - summary.total)}
          </span>
        </div>
        <ProgressBar value={progress * 100} label={`${Math.round(progress * 100)}%`} />
      </div>
    </div>
  );
}
