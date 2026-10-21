'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { Badge } from '@/components/ui';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

interface ResultRow {
  questionId: string;
  correct: boolean;
  answerIndex: number;
  explanation: string;
}

export function StoryQuiz({
  storyId,
  questions,
  bestScore,
}: {
  storyId: string;
  questions: QuizQuestion[];
  bestScore: number | null;
}) {
  const { dict } = useI18n();
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [result, setResult] = useState<{ score: number; total: number; results: ResultRow[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = answers.every((value) => value >= 0);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/stories/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, answers }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? dict.stories.quiz.error);
      }
      setResult((await res.json()) as { score: number; total: number; results: ResultRow[] });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : dict.stories.quiz.unknownError);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAnswers(questions.map(() => -1));
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {bestScore !== null ? (
        <p className="text-sm text-muted">
          {dict.stories.quiz.bestPrevious(bestScore, questions.length)}
        </p>
      ) : null}

      <ol className="flex flex-col gap-4">
        {questions.map((question, qIndex) => {
          const feedback = result?.results[qIndex];
          return (
            <li key={question.id} className="card flex flex-col gap-3 p-4">
              <p className="font-bold">
                {qIndex + 1}. {question.prompt}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option, oIndex) => {
                  const selected = answers[qIndex] === oIndex;
                  const isAnswer = feedback && feedback.answerIndex === oIndex;
                  const isWrongPick = feedback && selected && !feedback.correct;
                  return (
                    <label
                      key={oIndex}
                      className={
                        'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ' +
                        (isAnswer
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 '
                          : isWrongPick
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 '
                            : selected
                              ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/40 '
                              : 'border-line hover:border-brand-300 ')
                      }
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={selected}
                        disabled={Boolean(result) || busy}
                        onChange={() =>
                          setAnswers((prev) => prev.map((value, i) => (i === qIndex ? oIndex : value)))
                        }
                      />
                      <span>{option}</span>
                      {isAnswer ? <Badge tone="success">{dict.stories.quiz.correctBadge}</Badge> : null}
                    </label>
                  );
                })}
              </div>
              {feedback ? (
                <p className="text-xs text-muted">
                  {feedback.correct ? dict.stories.quiz.correct : dict.stories.quiz.wrong}
                  {feedback.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-rose-600">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-lg font-bold">
            {dict.stories.quiz.result(result.score, result.total)}
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
          >
            {dict.stories.quiz.retry}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!allAnswered || busy}
          onClick={submit}
          className="self-start rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? dict.stories.quiz.submitting : dict.stories.quiz.submit}
        </button>
      )}
    </div>
  );
}
