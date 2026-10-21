import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { storyAttemptSchema } from '@/lib/validation';
import {
  awardPoints,
  getBestStoryScore,
  getStoryBySlug,
  listStoryQuestions,
  saveStoryAttempt,
} from '@/lib/db/queries';
import { POINTS, pointsForImprovement } from '@/lib/points';

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

  const parsed = storyAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  const story = getStoryBySlug(parsed.data.storyId);
  if (!story) {
    return NextResponse.json({ error: 'القصة غير موجودة' }, { status: 404 });
  }

  const questions = listStoryQuestions(story.id);
  const results = questions.map((question, index) => ({
    questionId: question.id,
    correct: parsed.data.answers[index] === question.answerIndex,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
  }));
  const score = results.filter((result) => result.correct).length;

  const previousBest = getBestStoryScore(user.id, story.id) ?? 0;
  saveStoryAttempt({
    userId: user.id,
    storyId: story.id,
    score,
    total: questions.length,
    answers: parsed.data.answers,
  });

  const awarded = pointsForImprovement(score, previousBest) * POINTS.storyCorrect;
  if (awarded > 0) {
    awardPoints({ userId: user.id, source: 'STORY', sourceId: story.id, points: awarded });
  }

  return NextResponse.json({ score, total: questions.length, results, awardedPoints: awarded });
}
