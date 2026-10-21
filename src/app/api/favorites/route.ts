import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { favoriteSchema } from '@/lib/validation';
import { addFavorite, getVocabularyById, removeFavorite } from '@/lib/db/queries';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  if (!(await getVocabularyById(parsed.data.vocabId))) {
    return NextResponse.json({ error: 'الكلمة غير موجودة' }, { status: 404 });
  }

  if (parsed.data.favorite) {
    await addFavorite(user.id, parsed.data.vocabId);
  } else {
    await removeFavorite(user.id, parsed.data.vocabId);
  }

  return NextResponse.json({ ok: true, favorite: parsed.data.favorite });
}
