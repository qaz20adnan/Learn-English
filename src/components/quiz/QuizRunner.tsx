'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { QuestionType } from '@/lib/types';
import { useI18n } from '@/components/i18n/LocaleProvider';

export interface RunnerQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
}

function shuffleQuestions(items: RunnerQuestion[]): RunnerQuestion[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

interface QuestionResult {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  correctIndex: number | null;
  correctBoolean: boolean | null;
  acceptedAnswers: string[];
  explanation: string;
  earned: number;
  points: number;
}

interface ApiResponse {
  results: QuestionResult[];
  scorePoints: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
  awardedPoints: number;
  bestScorePoints: number;
  error?: string;
}

interface AnswerState {
  selectedIndex?: number;
  booleanAnswer?: boolean;
  textAnswer?: string;
}

export function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: RunnerQuestion[];
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const t = dict.quizzes.runner;
  const [ordered, setOrdered] = useState<RunnerQuestion[]>(questions);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Present the questions in a fresh random order (grading is keyed by question
  // id, so this is safe). Shuffled once per mount so a background refresh after
  // submitting does not wipe the results.
  const didShuffle = useRef(false);
  useEffect(() => {
    if (didShuffle.current) return;
    didShuffle.current = true;
    setOrdered(shuffleQuestions(questions));
  }, [questions]);

  const answeredAll = ordered.every((question) => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (question.type === 'MULTIPLE_CHOICE') return answer.selectedIndex != null;
    if (question.type === 'TRUE_FALSE') return answer.booleanAnswer != null;
    return Boolean(answer.textAnswer && answer.textAnswer.trim());
  });

  const resultById = new Map((result?.results ?? []).map((item) => [item.questionId, item]));
  const isDone = result !== null;

  function setAnswer(id: string, patch: AnswerState) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/quizzes/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          answers: ordered.map((question) => {
            const answer = answers[question.id] ?? {};
            return {
              questionId: question.id,
              selectedIndex: answer.selectedIndex ?? null,
              booleanAnswer: answer.booleanAnswer ?? null,
              textAnswer: answer.textAnswer ?? null,
            };
          }),
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error ?? t.error);
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknownError);
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setError(null);
    setAnswers({});
    setOrdered(shuffleQuestions(questions));
  }

  return (
    <div className="flex flex-col gap-4">
      {result ? (
        <div
          className={cn(
            'card flex flex-col gap-2 p-5',
            result.correctCount === result.totalQuestions
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
              : 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30',
          )}
        >
          <h2 className="text-lg font-extrabold">
            {t.result(result.scorePoints, result.maxPoints)}
          </h2>
          <p className="text-sm font-semibold text-muted">
            {t.correctCount(result.correctCount, result.totalQuestions)}
          </p>
          <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
            {result.awardedPoints > 0 ? t.pointsEarned(result.awardedPoints) : t.noPoints}
          </p>
        </div>
      ) : null}

      <ol className="flex flex-col gap-4">
        {ordered.map((question, index) => {
          const answer = answers[question.id] ?? {};
          const feedback = resultById.get(question.id);
          return (
            <li key={question.id}>
              <div className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">
                    <span className="text-muted">{index + 1}. </span>
                    {question.prompt}
                  </p>
                  {feedback ? (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold',
                        feedback.correct
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
                      )}
                    >
                      {feedback.correct ? t.correctBadge : '❌'}
                    </span>
                  ) : null}
                </div>

                {question.type === 'MULTIPLE_CHOICE' ? (
                  <div className="flex flex-col gap-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        dir="ltr"
                        className={cn(
                          'force-ltr flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                          answer.selectedIndex === optionIndex
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                            : 'border-line hover:border-brand-300',
                          feedback && feedback.correctIndex === optionIndex
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : '',
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={answer.selectedIndex === optionIndex}
                          disabled={isDone}
                          onChange={() => setAnswer(question.id, { selectedIndex: optionIndex })}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : null}

                {question.type === 'TRUE_FALSE' ? (
                  <div className="flex gap-2">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        disabled={isDone}
                        onClick={() => setAnswer(question.id, { booleanAnswer: value })}
                        className={cn(
                          'rounded-xl border px-4 py-2 text-sm font-bold transition disabled:opacity-70',
                          answer.booleanAnswer === value
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                            : 'border-line hover:border-brand-300',
                          feedback && feedback.correctBoolean === value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : '',
                        )}
                      >
                        {value ? t.trueLabel : t.falseLabel}
                      </button>
                    ))}
                  </div>
                ) : null}

                {question.type === 'FILL_BLANK' ? (
                  <input
                    dir="ltr"
                    className="force-ltr rounded-xl border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500"
                    placeholder={t.fillPlaceholder}
                    value={answer.textAnswer ?? ''}
                    disabled={isDone}
                    onChange={(event) => setAnswer(question.id, { textAnswer: event.target.value })}
                  />
                ) : null}

                {feedback ? (
                  <div className="flex flex-col gap-1 text-sm">
                    <p
                      className={cn(
                        'font-bold',
                        feedback.correct
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300',
                      )}
                    >
                      {feedback.correct ? t.correctText : t.wrongText}
                    </p>
                    <p className="text-muted">
                      <span className="font-semibold">{t.answerLabel} </span>
                      <span dir="ltr" className="force-ltr font-bold">
                        {feedback.type === 'TRUE_FALSE'
                          ? feedback.correctBoolean
                            ? t.trueLabel
                            : t.falseLabel
                          : feedback.type === 'MULTIPLE_CHOICE'
                            ? (question.options[feedback.correctIndex ?? -1] ?? '')
                            : feedback.acceptedAnswers.join(' / ')}
                      </span>
                    </p>
                    {feedback.explanation ? (
                      <p className="text-muted">{feedback.explanation}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {isDone ? (
          <>
            <button
              type="button"
              onClick={retry}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {t.retry}
            </button>
            <Link
              href="/quizzes"
              className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
            >
              {t.backToQuizzes} ←
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !answeredAll}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? t.submitting : t.submit}
            </button>
            {!answeredAll ? <span className="text-xs text-muted">{t.unanswered}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}
