import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  getCourseBySlug,
  listCourseProgress,
  listLessonsByCourse,
  listVocabulary,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import type { Dictionary } from '@/lib/i18n';
import { Badge, Card, LevelBadge, ProgressBar } from '@/components/ui';

type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

function statusMeta(dict: Dictionary, status: LessonStatus) {
  if (status === 'COMPLETED') {
    return { label: dict.courses.status.completed, tone: 'success' as const };
  }
  if (status === 'IN_PROGRESS') {
    return { label: dict.courses.status.inProgress, tone: 'info' as const };
  }
  return { label: dict.courses.status.notStarted, tone: 'neutral' as const };
}

export async function generateMetadata(props: PageProps<'/courses/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const course = getCourseBySlug(slug);
  return { title: course ? (course.titleAr ?? course.title) : dict.courses.notFound };
}

export default async function CoursePage(props: PageProps<'/courses/[slug]'>) {
  const user = await requireUser();
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const course = getCourseBySlug(slug);
  if (!course || !course.isPublished) notFound();

  const lessons = listLessonsByCourse(course.id);
  const progress = listCourseProgress(user.id, course.id);
  const vocabulary = listVocabulary({ courseId: course.id, limit: 8 });
  const completed = lessons.filter((lesson) => progress[lesson.id]?.status === 'COMPLETED').length;
  const percent = lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/courses" className="text-sm font-semibold text-muted hover:text-brand-600">
        ← {dict.courses.allCourses}
      </Link>

      <section className="card flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-4xl" aria-hidden>
              {course.coverEmoji}
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {course.titleAr ?? course.title}
              </h1>
              <p dir="ltr" className="force-ltr text-sm text-muted">
                {course.title}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <LevelBadge level={course.level} label={dict.levels[course.level]} />
                <Badge tone="brand">{course.category}</Badge>
              </div>
            </div>
          </div>
          <div className="min-w-[12rem]">
            <p className="mb-1 text-xs text-muted">{dict.courses.yourProgress}</p>
            <ProgressBar value={percent} label={`${percent}%`} />
            <p className="mt-1 text-xs text-muted">
              {dict.courses.completedOf(completed, lessons.length)}
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">{course.description}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">{dict.courses.lessonsHeading}</h2>
        <ol className="flex flex-col gap-3">
          {lessons.map((lesson, index) => {
            const state = progress[lesson.id]?.status ?? 'NOT_STARTED';
            const meta = statusMeta(dict, state);
            const actionLabel =
              state === 'COMPLETED'
                ? dict.courses.action.retry
                : state === 'IN_PROGRESS'
                  ? dict.courses.action.resume
                  : dict.courses.action.start;
            return (
              <Card key={lesson.id} as="li" className="flex flex-wrap items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                  {index + 1}
                </span>
                <div className="min-w-[12rem] flex-1">
                  <h3 className="font-bold">{lesson.title}</h3>
                  <p className="text-sm text-muted">{lesson.summary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {lesson.durationMinutes} {dict.courses.minutesShort}
                  </span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <Link
                    href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
                  >
                    {actionLabel}
                  </Link>
                </div>
              </Card>
            );
          })}
        </ol>
      </section>

      {vocabulary.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">{dict.courses.courseVocab}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {vocabulary.map((word) => (
              <Card key={word.id} className="flex flex-col gap-1">
                <span dir="ltr" className="force-ltr font-bold">
                  {word.term}
                </span>
                <span className="text-sm text-muted">{word.translation}</span>
                {word.phonetic ? (
                  <span dir="ltr" className="force-ltr text-xs text-muted">
                    {word.phonetic}
                  </span>
                ) : null}
              </Card>
            ))}
          </div>
          <Link
            href="/vocabulary"
            className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            {dict.courses.allVocab} ←
          </Link>
        </section>
      ) : null}
    </div>
  );
}
