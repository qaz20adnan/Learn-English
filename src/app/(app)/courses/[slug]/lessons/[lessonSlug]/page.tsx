import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  getCourseBySlug,
  getLessonBySlug,
  getLessonProgress,
  listCourseAssessments,
  listLessonVocabulary,
  listLessonsByCourse,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { buildEmbedUrl, buildWatchUrl } from '@/lib/media';
import { renderMarkdown } from '@/lib/markdown';
import { canAdvanceFrom, emptyAssessment, isLessonLocked } from '@/lib/progression';
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
  const t = dict.lesson;

  const course = await getCourseBySlug(slug);
  if (!course || !course.isPublished) notFound();
  const lesson = await getLessonBySlug(course.id, lessonSlug);
  if (!lesson) notFound();

  const lessons = await listLessonsByCourse(course.id);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  const [progress, vocabulary, previousVocabulary, assessments] = await Promise.all([
    getLessonProgress(user.id, lesson.id),
    listLessonVocabulary(lesson.id),
    prev ? listLessonVocabulary(prev.id) : Promise.resolve([]),
    listCourseAssessments(user.id, course.id),
  ]);

  const currentAssessment = assessments[lesson.id] ?? emptyAssessment(lesson.id);
  const previousAssessment = prev ? assessments[prev.id] : undefined;
  const locked = isLessonLocked(
    lessons.map((item) => item.id),
    index,
    assessments,
  );
  const canAdvance = !locked && canAdvanceFrom(currentAssessment);
  const previousQuizHref = previousAssessment?.quizSlug
    ? `/quizzes/${previousAssessment.quizSlug}`
    : null;
  const assessmentHref = currentAssessment.quizSlug
    ? `/quizzes/${currentAssessment.quizSlug}`
    : null;

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
          {t.breadcrumbCourses}
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
          {locked ? <Badge tone="warning">🔒 {t.lockedBadge}</Badge> : null}
          {currentAssessment.required && currentAssessment.passed ? (
            <Badge tone="success">✓ {t.assessmentPassedBadge}</Badge>
          ) : null}
        </div>
        {lesson.summary && lesson.summary !== lesson.title ? (
          <p className="text-sm text-muted">{lesson.summary}</p>
        ) : null}
        <p className="text-xs text-muted">
          {t.meta(index + 1, lessons.length, lesson.durationMinutes)}
          {lesson.titleAr ? ` · ${lesson.titleAr}` : ''}
        </p>
      </header>

      {prev ? (
        <section className="card flex flex-col gap-4 border-sky-200 bg-sky-50/60 p-5 dark:border-sky-900 dark:bg-sky-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                {t.reviewEyebrow}
              </p>
              <h2 className="text-lg font-extrabold">{t.reviewTitle}</h2>
              <p className="mt-1 text-sm text-muted">{t.reviewHint}</p>
            </div>
            {previousAssessment?.required ? (
              <Badge tone={previousAssessment.passed ? 'success' : 'warning'}>
                {previousAssessment.passed
                  ? t.reviewPassed
                  : t.reviewPending(previousAssessment.passPercent)}
              </Badge>
            ) : (
              <Badge tone="neutral">{t.reviewNoQuiz}</Badge>
            )}
          </div>

          <div className="rounded-xl bg-white/70 p-4 dark:bg-ink-900/50">
            <p className="font-bold">{prev.title}</p>
            {prev.summary && prev.summary !== prev.title ? (
              <p className="mt-1 text-sm text-muted">{prev.summary}</p>
            ) : null}
            {previousVocabulary.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {previousVocabulary.slice(0, 6).map((word) => (
                  <span
                    key={word.id}
                    className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs dark:bg-ink-800"
                  >
                    <span dir="ltr" className="force-ltr font-bold">
                      {word.term}
                    </span>
                    {' · '}
                    {word.translation}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/courses/${course.slug}/lessons/${prev.slug}`}
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold transition hover:border-brand-400 dark:bg-ink-900"
            >
              {t.reviewOpen}
            </Link>
            {previousQuizHref ? (
              <Link
                href={previousQuizHref}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                {t.reviewQuiz}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {locked ? (
        <section className="card flex flex-col items-start gap-3 border-amber-300 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
          <span className="text-3xl" aria-hidden>
            🔒
          </span>
          <h2 className="text-xl font-extrabold">{t.lockedTitle}</h2>
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            {t.lockedBody(prev?.title ?? '')}
          </p>
          {previousQuizHref ? (
            <Link
              href={previousQuizHref}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              {t.lockedCta}
            </Link>
          ) : null}
        </section>
      ) : (
        <>
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
                <h2 className="text-xl font-extrabold">{t.vocabulary}</h2>
                <p className="text-sm text-muted">{t.vocabularyHint}</p>
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
              <summary className="cursor-pointer font-bold">{t.transcript}</summary>
              <p dir="ltr" className="force-ltr mt-3 whitespace-pre-line leading-relaxed text-muted">
                {lesson.transcript}
              </p>
            </details>
          ) : null}

          {assessmentHref ? (
            <section
              className={`card flex flex-col gap-3 p-5 ${
                currentAssessment.passed
                  ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20'
                  : 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                    {t.assessmentEyebrow}
                  </p>
                  <h2 className="text-lg font-extrabold">
                    {currentAssessment.quizTitle ?? t.assessmentTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {t.assessmentHint(currentAssessment.passPercent)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentAssessment.bestPercent !== null ? (
                    <Badge tone={currentAssessment.passed ? 'success' : 'warning'}>
                      {t.assessmentBest(currentAssessment.bestPercent)}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">{t.assessmentNotStarted}</Badge>
                  )}
                  {currentAssessment.passed ? (
                    <Badge tone="success">{t.assessmentPassedBadge}</Badge>
                  ) : (
                    <Badge tone="warning">{t.assessmentRequiredBadge}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={assessmentHref}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  {currentAssessment.attempts === 0
                    ? t.assessmentStart
                    : currentAssessment.passed
                      ? t.assessmentReview
                      : t.assessmentRetry}
                </Link>
                <span className="text-xs text-muted">
                  {t.assessmentAttempts(currentAssessment.attempts)}
                </span>
              </div>
            </section>
          ) : null}
        </>
      )}

      <nav className="flex items-center justify-between gap-3">
        {prev ? (
          <Link
            href={`/courses/${course.slug}/lessons/${prev.slug}`}
            className="card flex flex-1 flex-col p-4 transition hover:border-brand-400"
          >
            <span className="text-xs text-muted">{t.prev}</span>
            <span className="font-bold">{prev.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          canAdvance ? (
            <Link
              href={`/courses/${course.slug}/lessons/${next.slug}`}
              className="card flex flex-1 flex-col p-4 text-end transition hover:border-brand-400"
            >
              <span className="text-xs text-muted">{t.next}</span>
              <span className="font-bold">{next.title}</span>
            </Link>
          ) : (
            <div className="card flex flex-1 flex-col items-end gap-1 border-dashed p-4 text-end opacity-90">
              <span className="text-xs text-muted">🔒 {t.nextLocked}</span>
              <span className="font-bold">{next.title}</span>
              <span className="text-xs text-muted">{t.nextLockedHint(currentAssessment.passPercent)}</span>
            </div>
          )
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
