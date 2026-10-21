import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  countFavorites,
  countQuizAttempts,
  getCourseProgressSummaries,
  getLearningStats,
  getPointsHistory,
  getPointsSummary,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Card, ProgressBar, SectionTitle, StatCard } from '@/components/ui';
import { PointsOverview } from '@/components/points/PointsOverview';

const POINT_SOURCES = ['LESSON', 'QUIZ', 'STORY', 'REVIEW'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.progress.metaTitle };
}

export default async function ProgressPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const [stats, summaries, points, history, quizAttempts, favorites] = await Promise.all([
    getLearningStats(user.id),
    getCourseProgressSummaries(user.id),
    getPointsSummary(user.id),
    getPointsHistory(user.id, 8),
    countQuizAttempts(user.id),
    countFavorites(user.id),
  ]);
  const started = summaries.filter((item) => item.totalLessons > 0);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={dict.progress.title} description={dict.progress.description} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="✅" label={dict.progress.lessonsCompleted} value={stats.lessonsCompleted} />
        <StatCard emoji="▶️" label={dict.progress.lessonsInProgress} value={stats.lessonsInProgress} />
        <StatCard emoji="⏱️" label={dict.progress.minutesLearned} value={stats.minutesLearned} />
        <StatCard emoji="🔁" label={dict.progress.reviewsDue} value={stats.reviewsDue} />
        <StatCard emoji="📝" label={dict.nav.quizzes} value={quizAttempts} />
        <StatCard emoji="⭐" label={dict.nav.favorites} value={favorites} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{dict.points.label}</h2>
        <PointsOverview summary={points} dict={dict} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <h3 className="font-bold">{dict.points.breakdown}</h3>
            {POINT_SOURCES.map((source) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span className="text-muted">{dict.points.source[source]}</span>
                <span className="font-bold">{points.bySource[source]}</span>
              </div>
            ))}
          </Card>
          <Card className="flex flex-col gap-2">
            <h3 className="font-bold">{dict.points.history}</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted">{dict.points.historyEmpty}</p>
            ) : (
              history.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{dict.points.source[event.source]}</span>
                  <span className="font-bold text-emerald-600">+{event.points}</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{dict.progress.byCourse}</h2>
        <div className="flex flex-col gap-3">
          {started.map((item) => (
            <Card key={item.course.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {item.course.coverEmoji}
                  </span>
                  <div>
                    <h3 className="font-bold">{item.course.titleAr ?? item.course.title}</h3>
                    <p className="text-xs text-muted">
                      {dict.progress.ofLessons(item.completedLessons, item.totalLessons)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/courses/${item.course.slug}`}
                  className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
                >
                  {dict.progress.open} ←
                </Link>
              </div>
              <ProgressBar value={item.percent} label={`${item.percent}%`} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
