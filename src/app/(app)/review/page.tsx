import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listDueCards } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Flashcards, type FlashcardItem } from '@/components/vocab/Flashcards';
import { SectionTitle } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.review.metaTitle };
}

export default async function ReviewPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const due = listDueCards(user.id, 20);

  const cards: FlashcardItem[] = due.map((card) => ({
    vocabId: card.vocab.id,
    term: card.vocab.term,
    translation: card.vocab.translation,
    partOfSpeech: card.vocab.partOfSpeech,
    phonetic: card.vocab.phonetic,
    example: card.vocab.example,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={dict.review.title} description={dict.review.description} />
      <div className="mx-auto w-full max-w-2xl">
        <Flashcards cards={cards} />
      </div>
    </div>
  );
}
