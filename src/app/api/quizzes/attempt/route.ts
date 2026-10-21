import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { quizAttemptSchema } from '@/lib/validation';
import {
  awardPoints,
  getBestQuizAttempt,
  getQuizById,
  listQuizQuestions,
  saveQuizAttempt,
} from '@/lib/db/queries';
import { gradeQuiz, type QuizQuestionDef } from '@/lib/quiz';
import { pointsForImprovement } from '@/lib/points';

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

  const quiz = await getQuizById(parsed.data.quizId);
  if (!quiz || !quiz.isPublished) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 });
  }

  const questions = await listQuizQuestions(quiz.id);
  if (questions.length === 0) {
    return NextResponse.json({ error: 'لا توجد أسئلة' }, { status: 400 });
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
  const awarded = pointsForImprovement(grade.scorePoints, previousBest?.scorePoints ?? 0);

  const attempt = await saveQuizAttempt({
    userId: user.id,
    quizId: quiz.id,
    scorePoints: grade.scorePoints,
    maxPoints: grade.maxPoints,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    answers: parsed.data.answers,
  });

  if (awarded > 0) {
    await awardPoints({ userId: user.id, source: 'QUIZ', sourceId: quiz.id, points: awarded });
  }

  return NextResponse.json({
    attempt,
    awardedPoints: awarded,
    results: grade.results,
    scorePoints: grade.scorePoints,
    maxPoints: grade.maxPoints,
    correctCount: grade.correctCount,
    totalQuestions: grade.totalQuestions,
    bestScorePoints: Math.max(previousBest?.scorePoints ?? 0, grade.scorePoints),
  });
}
