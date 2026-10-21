import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  getCourseProgressSummaries,
  getLearningStats,
  getPointsSummary,
  listCourses,
} from '@/lib/db/queries';
import { Card, LevelBadge, ProgressBar, SectionTitle, StatCard } from '@/components/ui';
import { PointsOverview } from '@/components/points/PointsOverview';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

export const metadata: Metadata = { title: 'لوحة التعلّم' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, summaries, points, { dict }] = await Promise.all([
    Promise.resolve(getLearningStats(user.id)),
    Promise.resolve(getCourseProgressSummaries(user.id)),
    Promise.resolve(getPointsSummary(user.id)),
    getLocaleAndDictionary(),
  ]);
  const t = dict.dashboard;

  const started = summaries
    .filter((item) => item.completedLessons > 0)
    .sort((a, b) => b.percent - a.percent);
  const recommended = started.length > 0 ? [] : listCourses().slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <section className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-l from-brand-600 to-brand-500 p-6 text-white">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.greeting(user.name)}</h1>
          <p className="mt-1 text-sm text-white/85">{t.greetingSub}</p>
        </div>
        <Link
          href="/courses"
          className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur transition hover:bg-white/25"
        >
          {t.browseCourses}
        </Link>
      </section>

      <section>
        <SectionTitle title={t.quickView} description={t.quickViewSub} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard emoji="✅" label={t.lessonsCompleted} value={stats.lessonsCompleted} />
          <StatCard emoji="⏱️" label={t.minutesLearned} value={stats.minutesLearned} />
          <StatCard emoji="📚" label={t.coursesStarted} value={stats.coursesStarted} />
          <StatCard
            emoji="🔁"
            label={t.reviewsDue}
            value={stats.reviewsDue}
            hint={stats.reviewsDue > 0 ? t.reviewNow : t.noReviews}
          />
        </div>
      </section>

      <section>
        <SectionTitle
          title={dict.points.label}
          description={dict.points.howToEarn}
          action={
            <Link
              href="/quizzes"
              className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
            >
              📝 {dict.nav.quizzes}
            </Link>
          }
        />
        <PointsOverview summary={points} dict={dict} />
      </section>

      {started.length > 0 ? (
        <section>
          <SectionTitle title={t.continueTitle} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {started.slice(0, 4).map((item) => (
              <Card key={item.course.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {item.course.coverEmoji}
                    </span>
                    <div>
                      <h3 className="font-bold">{item.course.titleAr ?? item.course.title}</h3>
                      <p className="text-xs text-muted">{item.course.title}</p>
                    </div>
                  </div>
                  <LevelBadge level={item.course.level} label={dict.levels[item.course.level]} />
                </div>
                <ProgressBar value={item.percent} label={`${item.course.title} ${item.percent}%`} />
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{t.ofLessons(item.completedLessons, item.totalLessons)}</span>
                  <Link
                    href={`/courses/${item.course.slug}`}
                    className="font-bold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    {t.continueAction} ←
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {recommended.length > 0 ? (
        <section>
          <SectionTitle title={t.recommendedTitle} description={t.recommendedSub} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recommended.map((course) => (
              <Card key={course.id} className="flex flex-col gap-2">
                <span className="text-2xl" aria-hidden>
                  {course.coverEmoji}
                </span>
                <h3 className="font-bold">{course.titleAr ?? course.title}</h3>
                <p className="text-xs text-muted">{course.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <LevelBadge level={course.level} label={dict.levels[course.level]} />
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    {t.openAction} ←
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
