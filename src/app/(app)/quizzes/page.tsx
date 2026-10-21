import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listQuizBestScores, listQuizzes } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Card, EmptyState, LevelBadge, SectionTitle } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.quizzes.metaTitle };
}

export default async function QuizzesPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.quizzes;
  const quizzes = listQuizzes();
  const best = listQuizBestScores(user.id);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t.title} description={t.description} />

      {quizzes.length === 0 ? (
        <EmptyState emoji="📝" title={t.emptyTitle} description={t.emptyDescription} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quizzes.map((quiz) => {
            const score = best[quiz.id];
            return (
              <Card key={quiz.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>
                      📝
                    </span>
                    <div>
                      <h3 className="font-bold">{quiz.titleAr ?? quiz.title}</h3>
                      <p className="text-xs text-muted">{quiz.description}</p>
                    </div>
                  </div>
                  <LevelBadge level={quiz.level} label={dict.levels[quiz.level]} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{t.questionsCount(quiz.questionCount ?? 0)}</span>
                  <span aria-hidden>·</span>
                  <span>{t.pointsAvailable(quiz.totalPoints ?? 0)}</span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-semibold text-muted">
                    {score ? t.bestScore(score.scorePoints, score.maxPoints) : t.notAttempted}
                  </span>
                  <Link
                    href={`/quizzes/${quiz.slug}`}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
                  >
                    {t.start}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
