import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { quizSessionSchema } from '@/lib/validation';
import { createQuizSession, getQuizById } from '@/lib/db/queries';

/**
 * Starts a fresh randomised attempt. The server stores the chosen question ids
 * in `quiz_sessions` and returns only the public question shape (never answers).
 */
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

  const parsed = quizSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  const quiz = await getQuizById(parsed.data.quizId);
  if (!quiz || !quiz.isPublished) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 });
  }

  const session = await createQuizSession(user.id, quiz.id, 8);
  if (!session) {
    return NextResponse.json({ error: 'لا توجد أسئلة' }, { status: 400 });
  }

  return NextResponse.json({
    sessionId: session.id,
    quizId: session.quizId,
    expiresAt: session.expiresAt,
    passPercent: quiz.passPercent,
    questions: session.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
    })),
  });
}
