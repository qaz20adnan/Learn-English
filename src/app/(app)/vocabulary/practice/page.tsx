import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listPracticeWords } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { LEVELS, type Level } from '@/lib/types';
import { EmptyState, SectionTitle } from '@/components/ui';
import { PracticeDeck, type FlashcardItem } from '@/components/vocab/PracticeDeck';

/**
 * Practice deck (Sprint 2): flashcards over the filtered word bank.
 *
 * Unlike /review (spaced repetition on due cards), this is a self-paced
 * practice session with no server writes — learners flip, self-assess and
 * optionally re-run the "study again" pile.
 */

const PRACTICE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function backHref(base: { q?: string; level?: string; pos?: string }): string {
  const params = new URLSearchParams();
  if (base.q) params.set('q', base.q);
  if (base.level) params.set('level', base.level);
  if (base.pos) params.set('pos', base.pos);
  const query = params.toString();
  return query ? `/vocabulary?${query}` : '/vocabulary';
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.vocabulary.practice.metaTitle };
}

export default async function VocabularyPracticePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.vocabulary.practice;

  const resolved = await searchParams;
  const q = first(resolved.q);
  const level = LEVELS.find((candidate) => candidate === first(resolved.level)) as
    | Level
    | undefined;
  const pos = first(resolved.pos);

  const words = await listPracticeWords({ q, level, pos }, PRACTICE_SIZE);

  const cards: FlashcardItem[] = words.map((word) => ({
    vocabId: word.id,
    term: word.term,
    translation: word.translation,
    partOfSpeech: word.partOfSpeech,
    phonetic: word.phonetic,
    example: word.example,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t.title} description={t.description} />

      <div className="mx-auto w-full max-w-2xl">
        {cards.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title={t.emptyTitle}
            description={t.emptyDescription}
            action={
              <Link
                href={backHref({ q, level, pos })}
                className="font-bold text-brand-600 hover:underline"
              >
                {t.backToBank}
              </Link>
            }
          />
        ) : (
          <>
            <PracticeDeck cards={cards} />
            <div className="mt-4 text-center">
              <Link
                href={backHref({ q, level, pos })}
                prefetch={false}
                className="text-sm font-bold text-brand-600 hover:underline"
              >
                {t.backToBank}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
