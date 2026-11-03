import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getLearningStats, getPointsSummary, getRoadmapData } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import {
  buildRoadmap,
  foldToStep,
  type RoadmapLevelCounts,
  type RoadmapStep,
} from '@/lib/roadmap';
import { Badge, Card, EmptyState, LevelBadge, ProgressBar, SectionTitle, StatCard } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.roadmap.metaTitle };
}

const STEP_EMOJI: Record<RoadmapStep, string> = {
  a1: '🌱',
  a2: '🌿',
  b1: '🌳',
  b2: '🏔️',
  c1: '🚀',
};

const DOT_CLASS: Record<string, string> = {
  completed: 'bg-emerald-500 text-white border-emerald-500',
  in_progress: 'bg-amber-400 text-white border-amber-400',
  upcoming: 'bg-[var(--surface-raised)] text-muted border-line',
  empty: 'bg-ink-100 text-ink-400 border-line dark:bg-ink-800 dark:text-ink-500',
};

export default async function RoadmapPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const [data, stats, points] = await Promise.all([
    getRoadmapData(user.id),
    getLearningStats(user.id),
    getPointsSummary(user.id),
  ]);

  // Fold the six stored levels onto the five visible CEFR steps.
  const counts: Partial<Record<RoadmapStep, RoadmapLevelCounts>> = {};
  const content: Record<RoadmapStep, { courses: number; stories: number; quizzes: number }> = {
    a1: { courses: 0, stories: 0, quizzes: 0 },
    a2: { courses: 0, stories: 0, quizzes: 0 },
    b1: { courses: 0, stories: 0, quizzes: 0 },
    b2: { courses: 0, stories: 0, quizzes: 0 },
    c1: { courses: 0, stories: 0, quizzes: 0 },
  };
  for (const row of data.steps) {
    const step = foldToStep(row.level);
    const bucket = counts[step] ?? { total: 0, done: 0 };
    counts[step] = {
      total: bucket.total + row.totalLessons,
      done: bucket.done + row.doneLessons,
    };
    content[step].courses += row.courses;
    content[step].stories += row.stories;
    content[step].quizzes += row.quizzes;
  }
  const plan = buildRoadmap(counts);
  const next = data.nextLesson;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={dict.roadmap.title} description={dict.roadmap.description} />

      {!plan.hasContent ? (
        <EmptyState
          emoji="🗺️"
          title={dict.roadmap.emptyPlatform}
          description={dict.roadmap.emptyPlatformHint}
          action={
            <Link
              href="/courses"
              className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
            >
              {dict.roadmap.browse} ←
            </Link>
          }
        />
      ) : (
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">
              {dict.roadmap.heroCurrent}
              {plan.currentStep ? `: ${dict.levels[plan.currentStep]}` : ''}
            </h2>
            <LevelBadge
              level={plan.currentStep ?? 'a1'}
              label={plan.currentStep ? dict.levels[plan.currentStep] : undefined}
            />
          </div>
          <ProgressBar value={plan.overallPercent} label={`${plan.overallPercent}%`} />
          <p className="text-sm text-muted">
            {plan.allCompleted
              ? dict.roadmap.heroAllDone
              : dict.roadmap.heroOverall(plan.overallPercent)}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="✅" label={dict.progress.lessonsCompleted} value={stats.lessonsCompleted} />
        <StatCard emoji="⏱️" label={dict.progress.minutesLearned} value={stats.minutesLearned} />
        <StatCard emoji="⭐" label={dict.points.label} value={points.total} />
        <StatCard
          emoji="🔥"
          label={dict.points.streak}
          value={dict.points.streakValue(points.streak)}
        />
      </div>

      {next ? (
        <Card className="flex flex-col gap-3 border-brand-200 dark:border-brand-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">🎯 {dict.roadmap.nextTitle}</h2>
            <LevelBadge level={next.step} label={dict.levels[next.step]} />
          </div>
          <p className="text-lg font-bold">{next.lessonTitleAr ?? next.lessonTitle}</p>
          <p className="text-sm text-muted">
            <span aria-hidden>{next.courseEmoji} </span>
            {next.courseTitleAr ?? next.courseTitle}
            <span aria-hidden> · </span>
            {dict.roadmap.fromCourse}
          </p>
          <Link
            href={`/courses/${next.courseSlug}/lessons/${next.lessonSlug}`}
            className="self-start rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-500"
          >
            {dict.roadmap.continue} ←
          </Link>
        </Card>
      ) : plan.hasContent ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold">🎉 {dict.roadmap.heroAllDone}</h2>
          <Link
            href="/courses"
            className="self-start text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            {dict.roadmap.browse} ←
          </Link>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{dict.roadmap.pathTitle}</h2>
        <ol className="flex flex-col gap-4">
          {plan.nodes.map((node) => {
            const chip = content[node.step];
            const isNextHere = node.current && next?.step === node.step;
            return (
              <li key={node.step} className="relative ps-12">
                <span
                  aria-hidden
                  className={`absolute start-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${DOT_CLASS[node.status]} ${
                    node.current ? 'ring-2 ring-brand-400' : ''
                  }`}
                >
                  {node.status === 'completed' ? '✓' : STEP_EMOJI[node.step]}
                </span>
                <Card
                  as="article"
                  className={`flex flex-col gap-3 ${
                    node.current ? 'ring-1 ring-brand-300 dark:ring-brand-800' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={node.step} label={dict.levels[node.step]} />
                      {node.current ? (
                        <Badge tone="brand">📍 {dict.roadmap.youAreHere}</Badge>
                      ) : null}
                    </div>
                    <Badge
                      tone={
                        node.status === 'completed'
                          ? 'success'
                          : node.status === 'in_progress'
                            ? 'warning'
                            : node.status === 'upcoming'
                              ? 'info'
                              : 'neutral'
                      }
                    >
                      {dict.roadmap.status[node.status]}
                    </Badge>
                  </div>
                  {node.total > 0 ? (
                    <>
                      <ProgressBar value={node.percent} label={`${node.percent}%`} />
                      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        <span>{dict.roadmap.chips.courses(chip.courses)}</span>
                        <span>{dict.roadmap.chips.lessons(node.total)}</span>
                        <span>{dict.roadmap.chips.stories(chip.stories)}</span>
                        <span>{dict.roadmap.chips.quizzes(chip.quizzes)}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted">{dict.roadmap.status.empty} 🚧</p>
                  )}
                  {isNextHere && next ? (
                    <Link
                      href={`/courses/${next.courseSlug}/lessons/${next.lessonSlug}`}
                      className="self-start text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
                    >
                      {dict.roadmap.continueHere} ←
                    </Link>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
