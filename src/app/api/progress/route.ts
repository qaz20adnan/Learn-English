import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { lessonProgressSchema } from '@/lib/validation';
import {
  awardPoints,
  getLessonById,
  getLessonProgress,
  saveLessonProgress,
} from '@/lib/db/queries';
import { POINTS } from '@/lib/points';

export const AUTO_COMPLETE_PERCENT = 95;

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

  const parsed = lessonProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  const lesson = await getLessonById(parsed.data.lessonId);
  if (!lesson) {
    return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
  }

  const previous = await getLessonProgress(user.id, lesson.id);
  const completed = parsed.data.completed === true || parsed.data.percent >= AUTO_COMPLETE_PERCENT;

  const progress = await saveLessonProgress({
    userId: user.id,
    lessonId: lesson.id,
    positionSeconds: parsed.data.positionSeconds,
    percent: parsed.data.percent,
    status: completed ? 'COMPLETED' : 'IN_PROGRESS',
  });

  const justCompleted = completed && previous?.status !== 'COMPLETED';
  if (justCompleted) {
    await awardPoints({
      userId: user.id,
      source: 'LESSON',
      sourceId: lesson.id,
      points: POINTS.lessonComplete,
    });
  }

  return NextResponse.json({ progress, awardedPoints: justCompleted ? POINTS.lessonComplete : 0 });
}
