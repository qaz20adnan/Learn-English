import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  createQuizSession,
  getBestQuizAttempt,
  getCourseById,
  getLessonById,
  getQuizBySlug,
  listLessonsByCourse,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { quizPercent } from '@/lib/progression';
import { Badge, LevelBadge, SectionTitle } from '@/components/ui';
import { QuizRunner } from '@/components/quiz/QuizRunner';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  const { dict } = await getLocaleAndDictionary();
  return { title: quiz ? (quiz.titleAr ?? quiz.title) : dict.quizzes.metaTitle };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.quizzes;

  const quiz = await getQuizBySlug(slug);
  if (!quiz || !quiz.isPublished) notFound();

  const [best, session] = await Promise.all([
    getBestQuizAttempt(user.id, quiz.id),
    createQuizSession(user.id, quiz.id, 8),
  ]);
  if (!session) notFound();

  const bestPercent = best ? quizPercent(best.scorePoints, best.maxPoints) : null;

  let lessonHref: string | null = null;
  let nextHref: string | null = null;
  if (quiz.lessonId) {
    const lesson = await getLessonById(quiz.lessonId);
    if (lesson) {
      const [course, lessons] = await Promise.all([
        getCourseById(lesson.courseId),
        listLessonsByCourse(lesson.courseId),
      ]);
      if (course) {
        lessonHref = `/courses/${course.slug}/lessons/${lesson.slug}`;
        const index = lessons.findIndex((item) => item.id === lesson.id);
        const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
        if (next) {
          nextHref = `/courses/${course.slug}/lessons/${next.slug}`;
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/quizzes"
          className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
        >
          {t.allQuizzes} ←
        </Link>
        <div className="mt-3">
          <SectionTitle
            title={quiz.titleAr ?? quiz.title}
            description={quiz.description}
            action={<LevelBadge level={quiz.level} label={dict.levels[quiz.level]} />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone="info">{t.questionsCount(quiz.questionCount ?? session.questions.length)}</Badge>
          <Badge tone="neutral">{t.questionsPerAttempt(session.questions.length)}</Badge>
          <Badge tone="brand">{t.pointsAvailable(quiz.totalPoints ?? 0)}</Badge>
          <Badge tone="warning">{t.passMark(quiz.passPercent)}</Badge>
          {best ? (
            <Badge tone={bestPercent !== null && bestPercent >= quiz.passPercent ? 'success' : 'danger'}>
              {t.bestScore(best.scorePoints, best.maxPoints)}
            </Badge>
          ) : (
            <Badge>{t.notAttempted}</Badge>
          )}
        </div>
      </div>

      <QuizRunner
        quizId={quiz.id}
        initialSessionId={session.id}
        questions={session.questions.map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options,
        }))}
        passPercent={quiz.passPercent}
        nextHref={nextHref}
        lessonHref={lessonHref}
      />
    </div>
  );
}
