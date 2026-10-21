'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Grade } from '@/lib/srs';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { Badge, ProgressBar } from '@/components/ui';

export interface FlashcardItem {
  vocabId: string;
  term: string;
  translation: string;
  partOfSpeech: string;
  phonetic: string | null;
  example: string;
}

const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

export function Flashcards({ cards }: { cards: FlashcardItem[] }) {
  const { dict } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tally, setTally] = useState<Record<Grade, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  if (cards.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <span className="text-4xl" aria-hidden>
          🎉
        </span>
        <h3 className="text-lg font-bold">{dict.review.emptyTitle}</h3>
        <p className="text-sm text-muted">{dict.review.emptyDescription}</p>
        <Link href="/vocabulary" className="mt-2 font-bold text-brand-600 hover:underline">
          {dict.review.vocabBank} ←
        </Link>
      </div>
    );
  }

  if (index >= cards.length) {
    const total = cards.length;
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <span className="text-4xl" aria-hidden>
          ✅
        </span>
        <h3 className="text-lg font-bold">{dict.review.completed(total)}</h3>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {GRADES.map((grade) => (
            <Badge key={grade} tone={grade === 'again' ? 'danger' : 'neutral'}>
              {dict.review.grades[grade]}: {tally[grade]}
            </Badge>
          ))}
        </div>
        <div className="mt-2 flex gap-3">
          <Link href="/vocabulary" className="font-bold text-brand-600 hover:underline">
            {dict.review.vocabBank}
          </Link>
          <Link href="/dashboard" className="font-bold text-brand-600 hover:underline">
            {dict.review.dashboard}
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[index];

  async function submitGrade(value: Grade) {
    setBusy(true);
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabId: card.vocabId, grade: value }),
      });
    } catch {
      /* keep going offline; the schedule will be retried next session */
    } finally {
      setTally((prev) => ({ ...prev, [value]: prev[value] + 1 }));
      setBusy(false);
      setFlipped(false);
      setIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar
        value={(index / cards.length) * 100}
        label={dict.review.cardProgress(index + 1, cards.length)}
      />

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-label={flipped ? dict.review.hide : dict.review.show}
        className="card flex min-h-[16rem] w-full flex-col items-center justify-center gap-3 p-8 text-center transition hover:border-brand-400"
      >
        <Badge tone="neutral">{card.partOfSpeech}</Badge>
        <span dir="ltr" className="force-ltr text-3xl font-black tracking-tight">
          {card.term}
        </span>
        {card.phonetic ? (
          <span dir="ltr" className="force-ltr text-sm text-muted">
            {card.phonetic}
          </span>
        ) : null}

        {flipped ? (
          <div className="mt-2 flex flex-col items-center gap-2">
            <span className="text-xl font-bold text-brand-700 dark:text-brand-300">
              {card.translation}
            </span>
            {card.example ? (
              <span dir="ltr" className="force-ltr text-sm text-muted">
                {card.example}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="mt-2 text-xs text-muted hint">{dict.review.tapToReveal}</span>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              disabled={busy}
              onClick={() => submitGrade(grade)}
              className={
                grade === 'again'
                  ? 'rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/40'
                  : 'rounded-xl border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand-400 disabled:opacity-60'
              }
            >
              {dict.review.grades[grade]}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {dict.review.reveal}
        </button>
      )}
    </div>
  );
}
