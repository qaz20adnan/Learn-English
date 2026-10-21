import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { countDueReviews, countVocabulary, listFavoriteIds, listVocabulary } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui';
import { FavoriteButton } from '@/components/vocab/FavoriteButton';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.vocabulary.metaTitle };
}

// A fresh random sample of the bank on every visit / refresh.
const SAMPLE_SIZE = 30;

export default async function VocabularyPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const [words, total, due, favoriteIdList] = await Promise.all([
    listVocabulary({ limit: SAMPLE_SIZE }),
    countVocabulary(),
    countDueReviews(user.id),
    listFavoriteIds(user.id),
  ]);
  const favoriteIds = new Set(favoriteIdList);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title={dict.vocabulary.title}
        description={dict.vocabulary.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/review"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              🔁 {dict.vocabulary.startReview}
              {due > 0 ? ` (${due})` : ''}
            </Link>
            <Link
              href="/vocabulary"
              prefetch={false}
              className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
            >
              {dict.vocabulary.reshuffle}
            </Link>
            <Link
              href="/favorites"
              className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-amber-400"
            >
              ⭐ {dict.favorites.metaTitle}
            </Link>
          </div>
        }
      />

      <p className="text-xs font-semibold text-muted">{dict.vocabulary.available(total)}</p>

      {due > 0 ? (
        <div className="card border-brand-300 bg-brand-50 p-4 text-sm font-semibold text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
          {dict.vocabulary.due(due)}
        </div>
      ) : null}

      {words.length === 0 ? (
        <EmptyState
          emoji="🧠"
          title={dict.vocabulary.emptyTitle}
          description={dict.vocabulary.emptyDescription}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((word) => (
            <Card key={word.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span dir="ltr" className="force-ltr text-lg font-extrabold">
                  {word.term}
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{word.partOfSpeech}</Badge>
                  <FavoriteButton
                    vocabId={word.id}
                    initialFavorite={favoriteIds.has(word.id)}
                  />
                </div>
              </div>
              <span className="font-semibold">{word.translation}</span>
              {word.phonetic ? (
                <span dir="ltr" className="force-ltr text-xs text-muted">
                  {word.phonetic}
                </span>
              ) : null}
              {word.example ? (
                <p dir="ltr" className="force-ltr text-sm text-muted">
                  {word.example}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
