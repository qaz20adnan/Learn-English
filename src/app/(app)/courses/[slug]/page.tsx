import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Award, BookOpen, CheckCircle2, Clock3, FileQuestion, ListChecks, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import {
  getCourseBySlug,
  getCourseUnits,
  getQuizById,
  listCourseAssessments,
  listCourseProgress,
  listLessonsByCourse,
  listVocabulary,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { isLessonLocked } from '@/lib/progression';
import type { Dictionary } from '@/lib/i18n';
import type { CourseUnit, Lesson } from '@/lib/types';
import { Badge, Card, EmptyState, LevelBadge, ProgressBar } from '@/components/ui';

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

/** One objective per line; blanks dropped. */
function parseObjectives(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Skills are comma-, Arabic-comma- or newline-separated tags. */
function parseSkills(raw: string): string[] {
  return raw
    .split(/[,،\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
      <span className="text-brand-500 dark:text-brand-300" aria-hidden>
        {icon}
      </span>
      {label}
      <span className="font-extrabold text-ink-800 dark:text-ink-100">{value}</span>
    </span>
  );
}

export async function generateMetadata(props: PageProps<'/courses/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const course = await getCourseBySlug(slug);
  return { title: course ? (course.titleAr ?? course.title) : dict.courses.notFound };
}

interface LessonGroup {
  key: string;
  heading: string;
  description?: string;
  lessons: Lesson[];
}

/**
 * Groups lessons by their units (Sprint 5 — course units). Courses without
 * units render exactly as before (one flat list); a course with units shows
 * one section per unit that owns lessons, plus an «other lessons» group only
 * when ungrouped lessons exist.
 */
function groupLessons(lessons: Lesson[], units: CourseUnit[], otherLabel: string): LessonGroup[] {
  if (units.length === 0) {
    return lessons.length > 0 ? [{ key: 'all', heading: '', lessons }] : [];
  }
  const byUnit = new Map<string, Lesson[]>();
  const ungrouped: Lesson[] = [];
  for (const lesson of lessons) {
    const unitId = lesson.unitId;
    if (unitId && units.some((unit) => unit.id === unitId)) {
      const bucket = byUnit.get(unitId) ?? [];
      bucket.push(lesson);
      byUnit.set(unitId, bucket);
    } else {
      ungrouped.push(lesson);
    }
  }
  const groups: LessonGroup[] = [];
  for (const unit of units) {
    const unitLessons = byUnit.get(unit.id);
    if (unitLessons && unitLessons.length > 0) {
      groups.push({
        key: unit.id,
        heading: unit.titleAr ?? unit.title,
        description: unit.summary || undefined,
        lessons: unitLessons,
      });
    }
  }
  if (ungrouped.length > 0) {
    groups.push({ key: 'ungrouped', heading: otherLabel, lessons: ungrouped });
  }
  return groups;
}

export default async function CoursePage(props: PageProps<'/courses/[slug]'>) {
  const user = await requireUser();
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const course = await getCourseBySlug(slug);
  if (!course || !course.isPublished) notFound();

  const [lessons, progress, vocabulary, assessments, units, finalQuiz] = await Promise.all([
    listLessonsByCourse(course.id),
    listCourseProgress(user.id, course.id),
    listVocabulary({ courseId: course.id, limit: 8 }),
    listCourseAssessments(user.id, course.id),
    getCourseUnits(course.id),
    course.finalQuizId ? getQuizById(course.finalQuizId) : Promise.resolve(null),
  ]);

  const completed = lessons.filter((lesson) => progress[lesson.id]?.status === 'COMPLETED').length;
  const percent = lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100);
  const lessonIds = lessons.map((lesson) => lesson.id);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const objectives = parseObjectives(course.objectives);
  const skills = parseSkills(course.skills);
  const groups = groupLessons(lessons, units, dict.courses.otherLessons);
  const courseComplete = lessons.length > 0 && percent >= 100;
  const showFinalQuiz = finalQuiz !== null && finalQuiz.isPublished;

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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LevelBadge level={course.level} label={dict.levels[course.level]} />
                <Badge tone="brand">{course.category}</Badge>
                {course.hasCertificate ? (
                  <Badge tone="warning">
                    <Award className="size-3.5" aria-hidden /> {dict.courses.certificateBadge}
                  </Badge>
                ) : null}
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

        {/* Sprint 5 — course info bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <InfoChip
            icon={<BookOpen className="size-3.5" />}
            label={dict.courses.infoLessons}
            value={String(lessons.length)}
          />
          {units.length > 0 ? (
            <InfoChip
              icon={<ListChecks className="size-3.5" />}
              label={dict.courses.infoUnits}
              value={String(units.length)}
            />
          ) : null}
          <InfoChip
            icon={<Clock3 className="size-3.5" />}
            label={dict.courses.infoDuration}
            value={dict.courses.totalDuration(totalMinutes)}
          />
          {course.estimatedHours !== null && course.estimatedHours > 0 ? (
            <InfoChip
              icon={<Clock3 className="size-3.5" />}
              label={dict.courses.infoDuration}
              value={dict.courses.estimatedHours(course.estimatedHours)}
            />
          ) : null}
          {course.prerequisites ? (
            <InfoChip
              icon={<Sparkles className="size-3.5" />}
              label={dict.courses.infoPrerequisites}
              value={dict.courses.prerequisitesValue(course.prerequisites)}
            />
          ) : null}
        </div>

        {/* Sprint 5 — learning objectives */}
        {objectives.length > 0 ? (
          <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-900/50">
            <h2 className="mb-2 text-sm font-extrabold">{dict.courses.objectivesHeading}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
                    aria-hidden
                  />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Sprint 5 — skills */}
        {skills.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted">{dict.courses.skillsHeading}:</span>
            {skills.map((skill) => (
              <Badge key={skill} tone="neutral">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      {/* 3.5 — course complete celebration */}
      {courseComplete ? (
        <section
          aria-label={dict.courses.courseCompleteTitle}
          className="card border-emerald-300 bg-gradient-to-l from-emerald-50 to-transparent p-5 dark:border-emerald-800 dark:from-emerald-950/40"
        >
          <h2 className="text-lg font-extrabold text-emerald-700 dark:text-emerald-200">
            {dict.courses.courseCompleteTitle}
          </h2>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-100/80">
            {dict.courses.courseCompleteSub}
          </p>
        </section>
      ) : null}

      {/* 3.5 — no published lessons yet */}
      {lessons.length === 0 ? (
        <EmptyState
          emoji="🚧"
          title={dict.courses.emptyLessonsTitle}
          description={dict.courses.emptyLessonsSub}
          action={
            <Link
              href="/courses"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {dict.courses.allCourses}
            </Link>
          }
        />
      ) : (
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-extrabold">{dict.courses.lessonsHeading}</h2>
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              {group.heading ? (
                <div>
                  <h3 className="text-base font-extrabold">
                    <span aria-hidden>📌</span> {group.heading}
                  </h3>
                  {group.description ? (
                    <p className="text-sm text-muted">{group.description}</p>
                  ) : null}
                </div>
              ) : null}
              <ol className="flex flex-col gap-3">
                {group.lessons.map((lesson) => {
                  const globalIndex = lessonIds.indexOf(lesson.id);
                  const state = progress[lesson.id]?.status ?? 'NOT_STARTED';
                  const meta = statusMeta(dict, state);
                  const assessment = assessments[lesson.id];
                  const locked = isLessonLocked(lessonIds, globalIndex, assessments);
                  const actionLabel = locked
                    ? dict.courses.action.locked
                    : state === 'COMPLETED'
                      ? dict.courses.action.retry
                      : state === 'IN_PROGRESS'
                        ? dict.courses.action.resume
                        : dict.courses.action.start;
                  return (
                    <Card key={lesson.id} as="li" className="flex flex-wrap items-center gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                        {globalIndex + 1}
                      </span>
                      <div className="min-w-[12rem] flex-1">
                        <h4 className="font-bold">{lesson.title}</h4>
                        {lesson.summary && lesson.summary !== lesson.title ? (
                          <p className="text-sm text-muted">{lesson.summary}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {lesson.durationMinutes} {dict.courses.minutesShort}
                        </span>
                        {locked ? <Badge tone="warning">🔒 {dict.courses.status.locked}</Badge> : null}
                        {!locked && assessment?.required && assessment.passed ? (
                          <Badge tone="success">✓ {dict.courses.status.assessmentPassed}</Badge>
                        ) : null}
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Link
                          href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                            locked
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-brand-600 hover:bg-brand-700'
                          }`}
                        >
                          {actionLabel}
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>
      )}

      {/* Sprint 5 — final quiz card */}
      {showFinalQuiz ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/30">
          <div className="flex items-start gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300"
              aria-hidden
            >
              <FileQuestion className="size-5" />
            </span>
            <div>
              <h2 className="font-extrabold">{dict.courses.finalQuizTitle}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {finalQuiz.titleAr ?? finalQuiz.title} — {dict.courses.finalQuizHint}
              </p>
            </div>
          </div>
          <Link
            href={`/quizzes/${finalQuiz.slug}`}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            {dict.courses.finalQuizAction} ←
          </Link>
        </Card>
      ) : null}

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
