'use client';

import { useState } from 'react';
import type { FlashcardItem } from './Flashcards';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { Badge, ProgressBar } from '@/components/ui';

export type { FlashcardItem };

/**
 * Self-paced practice deck (Sprint 2).
 *
 * Flips through the given cards, lets the learner self-assess ("I know it" /
 * "study again") and, at the end, offers a bonus round over the cards marked
 * for review. Deliberately performs no server writes — the SRS schedule in
 * /review stays untouched.
 */

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PracticeDeck({ cards }: { cards: FlashcardItem[] }) {
  const { dict } = useI18n();
  const t = dict.vocabulary.practice;

  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [againIds, setAgainIds] = useState<Set<string>>(new Set());
  const [round, setRound] = useState<'all' | 'again'>('all');

  const activeCards = round === 'again' ? deck.filter((card) => againIds.has(card.vocabId)) : deck;

  if (cards.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <span className="text-4xl" aria-hidden>
          🎉
        </span>
        <h3 className="text-lg font-bold">{t.emptyTitle}</h3>
        <p className="text-sm text-muted">{t.emptyDescription}</p>
      </div>
    );
  }

  if (index >= activeCards.length) {
    const knownCount = knownIds.size;
    const againCount = round === 'again' ? 0 : againIds.size;
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <span className="text-4xl" aria-hidden>
          ✅
        </span>
        <h3 className="text-lg font-bold">{t.completedTitle(knownCount, againCount)}</h3>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <Badge tone="success">✓ {t.knownBadge(knownCount)}</Badge>
          {againCount > 0 ? <Badge tone="warning">🔄 {t.againBadge(againCount)}</Badge> : null}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {againCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setRound('again');
                setIndex(0);
                setFlipped(false);
              }}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {t.restartAgain}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDeck((prev) => shuffle(prev));
              setRound('all');
              setIndex(0);
              setFlipped(false);
              setKnownIds(new Set());
              setAgainIds(new Set());
            }}
            className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
          >
            {t.restartAll}
          </button>
        </div>
      </div>
    );
  }

  const card = activeCards[index];

  function mark(self: 'known' | 'again') {
    if (self === 'known') {
      setKnownIds((prev) => new Set(prev).add(card.vocabId));
      setAgainIds((prev) => {
        const next = new Set(prev);
        next.delete(card.vocabId);
        return next;
      });
    } else {
      setAgainIds((prev) => new Set(prev).add(card.vocabId));
      setKnownIds((prev) => {
        const next = new Set(prev);
        next.delete(card.vocabId);
        return next;
      });
    }
    setFlipped(false);
    setIndex((prev) => prev + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar
        value={(index / activeCards.length) * 100}
        label={t.cardProgress(index + 1, activeCards.length)}
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
          <span className="mt-2 text-xs text-muted hint">{t.tapToReveal}</span>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => mark('known')}
            className="rounded-xl border border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
          >
            {t.knowIt}
          </button>
          <button
            type="button"
            onClick={() => mark('again')}
            className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            {t.studyAgain}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {t.reveal}
        </button>
      )}

      <p className="text-center text-xs font-semibold text-muted">
        {t.sessionStats(knownIds.size, againIds.size)}
      </p>
    </div>
  );
}
