import Link from 'next/link';
import type { Metadata } from 'next';
import { BookCheck, Clock3, LibraryBig, Repeat2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import {
  getContinueLearning,
  getDailyProgress,
  getLearningStats,
  getLearnerMilestones,
  getNextRecommendedCourse,
  getPointsSummary,
  getRoadmapData,
  listRecentLessons,
} from '@/lib/db/queries';
import { buildAchievements, countUnlocked } from '@/lib/achievements';
import { Card, LevelBadge, ProgressBar, SectionTitle, StatCard } from '@/components/ui';
import { PointsOverview } from '@/components/points/PointsOverview';
import { MotivationalBanner } from '@/components/dashboard/MotivationalBanner';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { DailyGoalCard } from '@/components/dashboard/DailyGoalCard';
import { RoadmapTeaserCard } from '@/components/dashboard/RoadmapTeaserCard';
import { AchievementsStrip } from '@/components/dashboard/AchievementsStrip';
import { getLocaleAndDictionary } from '@/lib/i18n/server';

export const metadata: Metadata = { title: 'لوحة التعلّم' };

/**
 * Learner dashboard — the 12 agreed elements (Sprint 5, IMPROVEMENT_PLAN 3.1):
 *  1. welcome card            2. «تابع التعلم» CTA (last in-progress lesson)
 *  3. daily goal progress     4. current stats
 *  5. due reviews banner      6. next recommended course
 *  7. recently opened lessons 8. achievements (starter set)
 *  9. motivational quote      10. roadmap link card
 * 11. points overview         12. browse-courses action (welcome card)
 *
 * Everything below is server-rendered from real DB numbers — no client JS,
 * no invented metrics.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, points, daily, continueLesson, recentLessons, milestones, roadmap, recommended, { dict }] =
    await Promise.all([
      getLearningStats(user.id),
      getPointsSummary(user.id),
      getDailyProgress(user.id),
      getContinueLearning(user.id),
      listRecentLessons(user.id, 4),
      getLearnerMilestones(user.id),
      getRoadmapData(user.id),
      getNextRecommendedCourse(user.id),
      getLocaleAndDictionary(),
    ]);
  const t = dict.dashboard;

  const achievements = buildAchievements({
    lessonsCompleted: milestones.lessonsCompleted,
    quizzesPassed: milestones.quizzesPassed,
    storiesStarted: milestones.storiesStarted,
    reviewsDone: milestones.reviewsDone,
    pointsTotal: points.total,
    currentStreak: points.streak,
  });
  const unlockedAchievements = countUnlocked(achievements);

  return (
    <div className="flex flex-col gap-8">
      {/* 1 + 12 — welcome card with the browse-courses action */}
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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/roadmap"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              🗺️ {t.roadmapCardAction}
            </Link>
            <Link
              href="/courses"
              className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              {t.browseCourses}
            </Link>
          </div>
        </div>
      </section>

      {/* 9 — motivational quote */}
      <MotivationalBanner />

      {/* 2 — continue learning CTA */}
      <ContinueLearningCard lesson={continueLesson} dict={dict} />

      {/* 3 + 10 — daily goal beside the roadmap teaser */}
      <div className="grid gap-3 lg:grid-cols-3">
        <DailyGoalCard progress={daily} dict={dict} />
        <div className="lg:col-span-2">
          <RoadmapTeaserCard data={roadmap} dict={dict} />
        </div>
      </div>

      {/* 4 — quick stats */}
      <section>
        <SectionTitle title={t.quickView} description={t.quickViewSub} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<BookCheck className="size-4" />} label={t.lessonsCompleted} value={stats.lessonsCompleted} />
          <StatCard icon={<Clock3 className="size-4" />} label={t.minutesLearned} value={stats.minutesLearned} />
          <StatCard icon={<LibraryBig className="size-4" />} label={t.coursesStarted} value={stats.coursesStarted} />
          <StatCard
            icon={<Repeat2 className="size-4" />}
            label={t.reviewsDue}
            value={stats.reviewsDue}
            hint={stats.reviewsDue > 0 ? t.reviewNow : t.noReviews}
          />
        </div>
      </section>

      {/* 5 — due reviews banner */}
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

      {/* 7 — recently opened lessons */}
      {recentLessons.length > 0 ? (
        <section>
          <SectionTitle title={t.recentLessonsTitle} description={t.recentLessonsSub} />
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentLessons.map((item) => (
              <Card key={`${item.courseSlug}/${item.lessonSlug}`} as="li" className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {item.courseEmoji}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{item.lessonTitleAr ?? item.lessonTitle}</h3>
                      <p className="truncate text-xs text-muted">
                        {item.courseTitleAr ?? item.courseTitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200'
                    }`}
                  >
                    {item.status === 'COMPLETED' ? t.recentLessonCompleted : t.recentLessonInProgress}
                  </span>
                </div>
                <ProgressBar value={item.percent} label={`${item.lessonTitle} ${item.percent}%`} />
                <Link
                  href={`/courses/${item.courseSlug}/lessons/${item.lessonSlug}`}
                  className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
                >
                  {t.continueAction} ←
                </Link>
              </Card>
            ))}
          </ol>
        </section>
      ) : null}

      {/* 6 — next recommended course */}
      {recommended ? (
        <section>
          <SectionTitle title={t.nextCourseTitle} description={t.nextCourseSub} />
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {recommended.coverEmoji}
              </span>
              <div>
                <h3 className="text-lg font-bold">{recommended.titleAr ?? recommended.title}</h3>
                <p className="max-w-xl text-sm text-muted">{recommended.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LevelBadge level={recommended.level} label={dict.levels[recommended.level]} />
              <Link
                href={`/courses/${recommended.slug}`}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                {t.openAction} ←
              </Link>
            </div>
          </Card>
        </section>
      ) : (
        <section>
          <SectionTitle title={t.nextCourseTitle} />
          <Card className="border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30">
            <h3 className="font-extrabold">{t.allCoursesDoneTitle}</h3>
            <p className="mt-1 text-sm text-muted">{t.allCoursesDoneSub}</p>
          </Card>
        </section>
      )}

      {/* 8 — achievements */}
      <AchievementsStrip items={achievements} unlockedCount={unlockedAchievements} dict={dict} />

      {/* 11 — points */}
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
    </div>
  );
}
