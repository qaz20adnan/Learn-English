import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getBestQuizAttempt, getQuizBySlug, listQuizQuestions } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Badge, LevelBadge, SectionTitle } from '@/components/ui';
import { QuizRunner } from '@/components/quiz/QuizRunner';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  const { dict } = await getLocaleAndDictionary();
  return { title: quiz ? (quiz.titleAr ?? quiz.title) : dict.quizzes.metaTitle };
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.quizzes;

  const quiz = getQuizBySlug(slug);
  if (!quiz || !quiz.isPublished) notFound();

  const questions = listQuizQuestions(quiz.id);
  if (questions.length === 0) notFound();

  const best = getBestQuizAttempt(user.id, quiz.id);
  const runnerQuestions = questions.map((question) => ({
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    options: question.options,
  }));

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
          <Badge tone="info">{t.questionsCount(questions.length)}</Badge>
          <Badge tone="brand">{t.pointsAvailable(quiz.totalPoints ?? 0)}</Badge>
          {best ? (
            <Badge tone="success">{t.bestScore(best.scorePoints, best.maxPoints)}</Badge>
          ) : (
            <Badge>{t.notAttempted}</Badge>
          )}
        </div>
      </div>

      <QuizRunner quizId={quiz.id} questions={runnerQuestions} />
    </div>
  );
}
