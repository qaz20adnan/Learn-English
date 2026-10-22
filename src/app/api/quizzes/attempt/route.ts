import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { quizAttemptSchema } from '@/lib/validation';
import {
  awardPoints,
  deleteQuizSession,
  getBestQuizAttempt,
  getQuizById,
  getQuizSessionForUser,
  listQuizQuestions,
  listQuizQuestionsByIds,
  saveQuizAttempt,
} from '@/lib/db/queries';
import { gradeQuiz, type QuizQuestionDef } from '@/lib/quiz';
import { pointsForImprovement } from '@/lib/points';
import { quizPercent } from '@/lib/progression';

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

  const parsed = quizAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  let quizId = parsed.data.quizId;
  let sessionQuestionIds: string[] | null = null;
  const sessionId = parsed.data.sessionId;

  if (sessionId) {
    const session = await getQuizSessionForUser(user.id, sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'انتهت جلسة الاختبار. ابدأ محاولة جديدة للحصول على أسئلة محدّثة.' },
        { status: 400 },
      );
    }
    quizId = session.quizId;
    sessionQuestionIds = session.questionIds;
  }

  if (!quizId) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 });
  }

  const quiz = await getQuizById(quizId);
  if (!quiz || !quiz.isPublished) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 });
  }

  const questions = sessionQuestionIds
    ? await listQuizQuestionsByIds(quiz.id, sessionQuestionIds)
    : await listQuizQuestions(quiz.id);
  if (questions.length === 0) {
    return NextResponse.json({ error: 'لا توجد أسئلة' }, { status: 400 });
  }
  if (sessionQuestionIds && questions.length !== sessionQuestionIds.length) {
    return NextResponse.json(
      { error: 'انتهت جلسة الاختبار. ابدأ محاولة جديدة للحصول على أسئلة محدّثة.' },
      { status: 400 },
    );
  }

  const definitions: (QuizQuestionDef & { id: string })[] = questions.map((question) => ({
    id: question.id,
    type: question.type,
    options: question.options,
    answerIndex: question.answerIndex,
    acceptedAnswers: question.acceptedAnswers,
    correctBoolean: question.correctBoolean,
    points: question.points,
    explanation: question.explanation,
  }));

  const grade = gradeQuiz(
    definitions,
    parsed.data.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedIndex: answer.selectedIndex ?? null,
      booleanAnswer: answer.booleanAnswer ?? null,
      textAnswer: answer.textAnswer ?? null,
    })),
  );

  const previousBest = await getBestQuizAttempt(user.id, quiz.id);
  const previousPercent = previousBest
    ? (quizPercent(previousBest.scorePoints, previousBest.maxPoints) ?? 0)
    : null;
  const awarded = pointsForImprovement(grade.correctCount, previousBest?.correctCount ?? 0);

  const attempt = await saveQuizAttempt({
    userId: user.id,
    quizId: quiz.id,
    scorePoints: grade.scorePoints,
    maxPoints: grade.maxPoints,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    answers: parsed.data.answers,
  });

  if (sessionId) {
    await deleteQuizSession(user.id, sessionId);
  }

  if (awarded > 0) {
    await awardPoints({ userId: user.id, source: 'QUIZ', sourceId: quiz.id, points: awarded });
  }

  const percent = quizPercent(grade.scorePoints, grade.maxPoints) ?? 0;
  const bestPercent = Math.max(previousPercent ?? 0, percent);

  return NextResponse.json({
    attempt,
    awardedPoints: awarded,
    results: grade.results,
    scorePoints: grade.scorePoints,
    maxPoints: grade.maxPoints,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    percent,
    passPercent: quiz.passPercent,
    passed: percent >= quiz.passPercent,
    bestPercent,
    bestScorePoints: Math.max(previousBest?.scorePoints ?? 0, grade.scorePoints),
  });
}
