import Link from 'next/link';
import { PlayCircle, Route } from 'lucide-react';
import type { ContinueLesson } from '@/lib/db/queries';
import type { Dictionary } from '@/lib/i18n';

/**
 * Dashboard element #2 — the big «تابع التعلم» CTA (Sprint 5, 3.1).
 *
 * Server-safe (no hooks/JS): when there is a lesson to resume it links
 * straight to it; otherwise it points the learner at the roadmap. Both states
 * render real data only.
 */
export function ContinueLearningCard({
  lesson,
  dict,
}: {
  lesson: ContinueLesson | null;
  dict: Dictionary;
}) {
  const t = dict.dashboard;

  if (!lesson) {
    return (
      <section
        aria-label={t.startLearningTitle}
        className="card flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50/60 p-5 dark:border-brand-900 dark:bg-brand-950/30"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300"
            aria-hidden
          >
            <Route className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">{t.startLearningTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.startLearningHint}</p>
          </div>
        </div>
        <Link
          href="/roadmap"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
        >
          {t.startAction} ←
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label={t.continueLearningTitle}
      className="card flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-gradient-to-l from-brand-50 to-transparent p-5 dark:border-brand-900 dark:from-brand-950/40"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="text-3xl" aria-hidden>
          {lesson.courseEmoji}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            {t.continueLearningTitle}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-extrabold">
            {lesson.lessonTitleAr ?? lesson.lessonTitle}
          </h2>
          <p className="truncate text-sm text-muted">
            {t.lessonInCourse(lesson.courseTitleAr ?? lesson.courseTitle)} ·{' '}
            <span dir="ltr" className="force-ltr">
              {lesson.percent}%
            </span>
          </p>
        </div>
      </div>
      <Link
        href={`/courses/${lesson.courseSlug}/lessons/${lesson.lessonSlug}`}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
      >
        <PlayCircle className="size-4" aria-hidden />
        {t.resumeAction} ←
      </Link>
    </section>
  );
}
