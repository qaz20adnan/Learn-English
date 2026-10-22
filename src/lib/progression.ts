/**
 * Pure progression rules shared by the server pages, the progress API and the
 * quiz endpoints. Keeping these helpers free of database imports makes the
 * unlock rules easy to test and impossible to drift between screens.
 */
import type { LessonAssessment } from './types';

export const DEFAULT_QUIZ_PASS_PERCENT = 70;

/** Rounded percentage for an attempt, or null when the quiz has no points. */
export function quizPercent(scorePoints: number, maxPoints: number): number | null {
  if (!Number.isFinite(scorePoints) || !Number.isFinite(maxPoints) || maxPoints <= 0) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round((scorePoints / maxPoints) * 100)));
}

export function hasPassedQuiz(
  scorePoints: number,
  maxPoints: number,
  passPercent: number,
): boolean {
  const percent = quizPercent(scorePoints, maxPoints);
  return percent !== null && percent >= passPercent;
}

/**
 * A lesson is unlocked when it is the first one or the previous lesson has no
 * required assessment, or the learner already passed that assessment.
 */
export function isLessonLocked(
  lessonIds: string[],
  index: number,
  assessments: Record<string, LessonAssessment | undefined>,
): boolean {
  if (index <= 0 || index >= lessonIds.length) return false;
  const previous = assessments[lessonIds[index - 1]];
  if (!previous) return false;
  return previous.required && !previous.passed;
}

/** Whether the learner may continue from this lesson to the next one. */
export function canAdvanceFrom(assessment: LessonAssessment | undefined): boolean {
  if (!assessment) return true;
  return !assessment.required || assessment.passed;
}

export function emptyAssessment(lessonId: string): LessonAssessment {
  return {
    lessonId,
    quizId: null,
    quizSlug: null,
    quizTitle: null,
    required: false,
    passed: true,
    passPercent: DEFAULT_QUIZ_PASS_PERCENT,
    bestPercent: null,
    attempts: 0,
  };
}
