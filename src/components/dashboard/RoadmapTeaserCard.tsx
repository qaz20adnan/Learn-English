import Link from 'next/link';
import { Map } from 'lucide-react';
import { buildRoadmap, foldToStep, type RoadmapLevelCounts } from '@/lib/roadmap';
import type { RoadmapData } from '@/lib/db/queries';
import type { Dictionary } from '@/lib/i18n';

const STEP_EMOJI: Record<string, string> = {
  a1: '🌱',
  a2: '🌿',
  b1: '🌳',
  b2: '🏔️',
  c1: '🚀',
};

/**
 * Dashboard element #10 — roadmap teaser card (Sprint 5, 3.1).
 *
 * A compact view of the CEFR path driven by the learner's real lesson counts
 * (same `buildRoadmap` rules as the full /roadmap page) plus the next lesson
 * on the path. Everything links to /roadmap.
 */
export function RoadmapTeaserCard({ data, dict }: { data: RoadmapData; dict: Dictionary }) {
  const t = dict.dashboard;

  const counts: Partial<Record<string, RoadmapLevelCounts>> = {};
  for (const row of data.steps) {
    const step = foldToStep(row.level);
    const bucket = counts[step] ?? { total: 0, done: 0 };
    counts[step] = { total: bucket.total + row.totalLessons, done: bucket.done + row.doneLessons };
  }
  const plan = buildRoadmap(counts);

  return (
    <section aria-label={t.roadmapCardTitle} className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300"
            aria-hidden
          >
            <Map className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">{t.roadmapCardTitle}</h2>
            <p className="text-sm text-muted">{t.roadmapCardSub}</p>
          </div>
        </div>
        <Link
          href="/roadmap"
          className="shrink-0 rounded-xl border border-line px-3 py-1.5 text-sm font-bold transition hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300"
        >
          {t.roadmapCardAction} ←
        </Link>
      </div>

      <ol className="flex flex-wrap items-center gap-2">
        {plan.nodes.map((node) => (
          <li key={node.step}>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                node.status === 'completed'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : node.status === 'in_progress'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                    : node.status === 'upcoming'
                      ? 'border-line bg-surface text-muted'
                      : 'border-line text-ink-400 dark:text-ink-500'
              }`}
            >
              <span aria-hidden>{STEP_EMOJI[node.step]}</span>
              <span dir="ltr" className="force-ltr uppercase">
                {node.step}
              </span>
              {node.total > 0 ? (
                <span dir="ltr" className="force-ltr font-medium opacity-80">
                  {node.done}/{node.total}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-900/50">
        <p className="font-bold">{t.roadmapNextLabel}</p>
        <p className="mt-0.5 text-muted">
          {data.nextLesson
            ? `${data.nextLesson.courseEmoji} ${
                data.nextLesson.lessonTitleAr ?? data.nextLesson.lessonTitle
              }`
            : t.roadmapNoNext}
        </p>
      </div>
    </section>
  );
}
