import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getCourseProgressSummaries } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { CATALOG_COURSES, CATALOG_LEVELS } from '@/lib/content/catalog';
import { Card, LevelBadge, ProgressBar, SectionTitle } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.courses.metaTitle };
}

export default async function CoursesPage() {
  const user = await requireUser();
  const { locale, dict } = await getLocaleAndDictionary();
  const summaries = await getCourseProgressSummaries(user.id);

  const groupBySlug = new Map(CATALOG_COURSES.map((course) => [course.slug, course.levelGroup]));

  const groups = CATALOG_LEVELS.map((level) => ({
    group: level.group,
    title: locale === 'ar' ? level.titleAr : level.title,
    description: level.description,
    items: summaries.filter((item) => groupBySlug.get(item.course.slug) === level.group),
  })).filter((group) => group.items.length > 0);

  const ungrouped = summaries.filter((item) => !groupBySlug.has(item.course.slug));

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        title={dict.courses.libraryTitle}
        description={dict.courses.libraryDescription}
      />

      {groups.map((group) => (
        <section key={group.group} className="flex flex-col gap-4">
          <div className="border-s-4 border-brand-500 ps-3">
            <h2 className="text-xl font-extrabold">{group.title}</h2>
            <p className="text-sm text-muted">{group.description}</p>
          </div>
          <CourseGrid items={group.items} dict={dict} />
        </section>
      ))}

      {ungrouped.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="border-s-4 border-line ps-3">
            <h2 className="text-xl font-extrabold">{dict.courses.allCourses}</h2>
          </div>
          <CourseGrid items={ungrouped} dict={dict} />
        </section>
      ) : null}
    </div>
  );
}

type CourseSummary = Awaited<ReturnType<typeof getCourseProgressSummaries>>[number];

function CourseGrid({ items, dict }: { items: CourseSummary[]; dict: Awaited<ReturnType<typeof getLocaleAndDictionary>>['dict'] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.course.id} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-3xl" aria-hidden>
              {item.course.coverEmoji}
            </span>
            <LevelBadge level={item.course.level} label={dict.levels[item.course.level]} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{item.course.titleAr ?? item.course.title}</h3>
            <p dir="ltr" className="force-ltr text-xs text-muted">
              {item.course.title}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted">{item.course.description}</p>
          <ProgressBar value={item.percent} label={`${item.course.title} ${item.percent}%`} />
          <div className="mt-auto flex items-center justify-between text-xs text-muted">
            <span>{dict.courses.lessonsSummary(item.totalLessons, item.completedLessons)}</span>
            <Link
              href={`/courses/${item.course.slug}`}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
            >
              {dict.courses.openCourse}
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
