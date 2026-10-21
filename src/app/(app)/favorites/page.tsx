import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listFavoriteIds, listFavoriteVocabulary } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui';
import { FavoriteButton } from '@/components/vocab/FavoriteButton';
import { AddWordForm } from '@/components/vocab/AddWordForm';
import { createWordAction } from './actions';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.favorites.metaTitle };
}

export default async function FavoritesPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.favorites;
  const words = listFavoriteVocabulary(user.id);
  const favoriteIds = new Set(listFavoriteIds(user.id));

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title={t.title}
        description={t.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/review"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              🔁 {t.review}
            </Link>
            <Link
              href="/vocabulary"
              className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
            >
              {t.linkToBank}
            </Link>
          </div>
        }
      />

      <AddWordForm action={createWordAction} />

      {words.length === 0 ? (
        <EmptyState emoji="⭐" title={t.emptyTitle} description={t.emptyDescription} />
      ) : (
        <>
          <p className="text-sm text-muted">{t.count(words.length)}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((word) => {
              const mine = word.createdBy === user.id;
              return (
                <Card key={word.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span dir="ltr" className="force-ltr text-lg font-extrabold">
                      {word.term}
                    </span>
                    {mine ? (
                      <Badge tone="brand">{t.myWord}</Badge>
                    ) : (
                      <FavoriteButton
                        vocabId={word.id}
                        initialFavorite={favoriteIds.has(word.id)}
                      />
                    )}
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
