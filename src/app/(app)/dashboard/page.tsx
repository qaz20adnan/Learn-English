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
import { MotivationalBanner } from '@/components/dashboard/MotivationalBanner';
import { DeveloperCredit } from '@/components/layout/DeveloperCredit';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

export const metadata: Metadata = { title: 'لوحة التعلّم' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, summaries, points, courses, { dict }] = await Promise.all([
    getLearningStats(user.id),
    getCourseProgressSummaries(user.id),
    getPointsSummary(user.id),
    listCourses(),
    getLocaleAndDictionary(),
  ]);
  const t = dict.dashboard;

  const started = summaries
    .filter((item) => item.completedLessons > 0)
    .sort((a, b) => b.percent - a.percent);
  const recommended = started.length > 0 ? [] : courses.slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <section className="card relative overflow-hidden bg-gradient-to-l from-brand-600 via-brand-500 to-brand-400 p-6 text-white shadow-xl shadow-brand-600/15">
        <div
          aria-hidden
          className="absolute -end-10 -top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 start-1/4 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{t.greeting(user.name)}</h1>
            <p className="mt-1 max-w-xl text-sm text-white/85">{t.greetingSub}</p>
          </div>
          <Link
            href="/courses"
            className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
          >
            {t.browseCourses}
          </Link>
        </div>
      </section>

      <MotivationalBanner />

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

      {stats.reviewsDue > 0 ? (
        <Link
          href="/review"
          className="card flex flex-wrap items-center justify-between gap-4 border-amber-300 bg-amber-50 p-5 transition hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/30"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden>
              🔁
            </span>
            <div>
              <h2 className="font-extrabold">{dict.review.title}</h2>
              <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
                {dict.review.duePrompt(stats.reviewsDue)}
              </p>
            </div>
          </div>
          <span className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">
            {dict.review.startNow}
          </span>
        </Link>
      ) : null}

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

      <DeveloperCredit variant="card" />
    </div>
  );
}
