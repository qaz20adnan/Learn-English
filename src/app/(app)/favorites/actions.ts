'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/dal';
import { createVocabulary, ensureReviewEntries } from '@/lib/db/queries';
import { wordSchema } from '@/lib/validation';

export interface AddWordState {
  ok?: boolean;
  errorKey?: 'invalidValues';
}

export async function createWordAction(
  _prev: AddWordState,
  formData: FormData,
): Promise<AddWordState> {
  const user = await requireUser();
  const parsed = wordSchema.safeParse({
    term: formData.get('term'),
    translation: formData.get('translation'),
    partOfSpeech: formData.get('partOfSpeech') || undefined,
    phonetic: formData.get('phonetic') || undefined,
    example: formData.get('example') || undefined,
  });
  if (!parsed.success) {
    return { errorKey: 'invalidValues' };
  }

  createVocabulary({ ...parsed.data, createdBy: user.id });
  ensureReviewEntries(user.id);

  revalidatePath('/favorites');
  revalidatePath('/vocabulary');
  revalidatePath('/review');
  return { ok: true };
}
