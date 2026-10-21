import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { reviewSchema } from '@/lib/validation';
import {
  awardPoints,
  ensureReviewEntries,
  getReviewCard,
  saveReviewState,
} from '@/lib/db/queries';
import { schedule } from '@/lib/srs';
import { pointsForGrade } from '@/lib/points';

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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  ensureReviewEntries(user.id);
  const card = getReviewCard(user.id, parsed.data.vocabId);
  if (!card) {
    return NextResponse.json({ error: 'البطاقة غير موجودة' }, { status: 404 });
  }

  const next = schedule(
    {
      ease: card.ease,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      lapses: card.lapses,
    },
    parsed.data.grade,
  );

  saveReviewState({
    userId: user.id,
    vocabId: parsed.data.vocabId,
    ease: next.ease,
    intervalDays: next.intervalDays,
    repetitions: next.repetitions,
    lapses: next.lapses,
    dueAt: next.dueAt.toISOString(),
  });

  const awarded = pointsForGrade(parsed.data.grade);
  if (awarded > 0) {
    awardPoints({ userId: user.id, source: 'REVIEW', sourceId: parsed.data.vocabId, points: awarded });
  }

  return NextResponse.json({
    ok: true,
    awardedPoints: awarded,
    next: { intervalDays: next.intervalDays, dueAt: next.dueAt.toISOString() },
  });
}
