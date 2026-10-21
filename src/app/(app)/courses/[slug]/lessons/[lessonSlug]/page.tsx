import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  getCourseBySlug,
  getLessonBySlug,
  getLessonProgress,
  getQuizByLessonId,
  listLessonVocabulary,
  listLessonsByCourse,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { buildEmbedUrl, buildWatchUrl } from '@/lib/media';
import { renderMarkdown } from '@/lib/markdown';
import { Badge, Card } from '@/components/ui';
import { LessonExperience } from '@/components/media/LessonExperience';
import { MediaStatusBadge } from '@/components/media/MediaStatusBadge';
import type { ClientMedia } from '@/components/media/types';

export async function generateMetadata(
  props: PageProps<'/courses/[slug]/lessons/[lessonSlug]'>,
): Promise<Metadata> {
  const { slug, lessonSlug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const course = await getCourseBySlug(slug);
  const lesson = course ? await getLessonBySlug(course.id, lessonSlug) : null;
  return { title: lesson ? lesson.title : dict.lesson.notFound };
}

export default async function LessonPage(
  props: PageProps<'/courses/[slug]/lessons/[lessonSlug]'>,
) {
  const user = await requireUser();
  const { slug, lessonSlug } = await props.params;
  const { dict } = await getLocaleAndDictionary();

  const course = await getCourseBySlug(slug);
  if (!course || !course.isPublished) notFound();
  const lesson = await getLessonBySlug(course.id, lessonSlug);
  if (!lesson) notFound();

  const lessons = await listLessonsByCourse(course.id);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const [progress, quiz, vocabulary] = await Promise.all([
    getLessonProgress(user.id, lesson.id),
    getQuizByLessonId(lesson.id),
    listLessonVocabulary(lesson.id),
  ]);

  const clientMedia: ClientMedia | null = lesson.media
    ? {
        id: lesson.media.id,
        provider: lesson.media.provider,
        externalId: lesson.media.externalId,
        url: lesson.media.url,
        title: lesson.media.title,
        verificationStatus: lesson.media.verificationStatus,
        verificationNote: lesson.media.verificationNote,
        embedUrl: buildEmbedUrl(lesson.media.provider, lesson.media.externalId, lesson.media.url),
        watchUrl: buildWatchUrl(lesson.media.provider, lesson.media.externalId, lesson.media.url),
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/courses" className="hover:text-brand-600">
          {dict.lesson.breadcrumbCourses}
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/courses/${course.slug}`} className="hover:text-brand-600">
          {course.titleAr ?? course.title}
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight">{lesson.title}</h1>
          {lesson.media ? (
            <MediaStatusBadge
              status={lesson.media.verificationStatus}
              note={lesson.media.verificationNote}
              label={dict.media.verification[lesson.media.verificationStatus]}
            />
          ) : null}
        </div>
        <p className="text-sm text-muted">{lesson.summary}</p>
        <p className="text-xs text-muted">
          {dict.lesson.meta(index + 1, lessons.length, lesson.durationMinutes)}
          {lesson.titleAr ? ` · ${lesson.titleAr}` : ''}
        </p>
      </header>

      <LessonExperience
        lessonId={lesson.id}
        media={clientMedia}
        initial={{
          status: progress?.status ?? 'NOT_STARTED',
          positionSeconds: progress?.positionSeconds ?? 0,
          percent: progress?.percent ?? 0,
        }}
      />

      <article className="prose-lesson card p-6">{renderMarkdown(lesson.content)}</article>

      {vocabulary.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-extrabold">{dict.lesson.vocabulary}</h2>
            <p className="text-sm text-muted">{dict.lesson.vocabularyHint}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vocabulary.map((word) => (
              <Card key={word.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span dir="ltr" className="force-ltr text-lg font-extrabold">
                    {word.term}
                  </span>
                  <Badge tone="brand">{word.partOfSpeech}</Badge>
                </div>
                <span className="font-semibold">{word.translation}</span>
                {word.phonetic ? (
                  <span dir="ltr" className="force-ltr text-xs text-muted">
                    {word.phonetic}
                  </span>
                ) : null}
                {word.example ? (
                  <p dir="ltr" className="force-ltr text-sm text-muted">
                    {word.example}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.transcript ? (
        <details className="card p-5">
          <summary className="cursor-pointer font-bold">{dict.lesson.transcript}</summary>
          <p dir="ltr" className="force-ltr mt-3 whitespace-pre-line leading-relaxed text-muted">
            {lesson.transcript}
          </p>
        </details>
      ) : null}

      {quiz ? (
        <Link
          href={`/quizzes/${quiz.slug}`}
          className="card flex flex-wrap items-center justify-between gap-3 border-brand-300 bg-brand-50 p-5 transition hover:border-brand-400 dark:border-brand-800 dark:bg-brand-950/40"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              📝
            </span>
            <div>
              <p className="font-bold">{dict.quizzes.linkedLesson}</p>
              <p className="text-sm text-muted">{quiz.titleAr ?? quiz.title}</p>
            </div>
          </div>
          <span className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white">
            {dict.quizzes.start}
          </span>
        </Link>
      ) : null}

      <nav className="flex items-center justify-between gap-3">
        {prev ? (
          <Link
            href={`/courses/${course.slug}/lessons/${prev.slug}`}
            className="card flex flex-1 flex-col p-4 transition hover:border-brand-400"
          >
            <span className="text-xs text-muted">{dict.lesson.prev}</span>
            <span className="font-bold">{prev.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/courses/${course.slug}/lessons/${next.slug}`}
            className="card flex flex-1 flex-col p-4 text-end transition hover:border-brand-400"
          >
            <span className="text-xs text-muted">{dict.lesson.next}</span>
            <span className="font-bold">{next.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
