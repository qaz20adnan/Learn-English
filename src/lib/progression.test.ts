import { describe, expect, it } from 'vitest';
import {
  canAdvanceFrom,
  emptyAssessment,
  hasPassedQuiz,
  isLessonLocked,
  quizPercent,
} from './progression';
import type { LessonAssessment } from './types';

function assessment(overrides: Partial<LessonAssessment> = {}): LessonAssessment {
  return {
    ...emptyAssessment('lesson'),
    required: true,
    passed: false,
    passPercent: 70,
    bestPercent: 50,
    ...overrides,
  };
}

describe('quiz percentages', () => {
  it('rounds and clamps percentages', () => {
    expect(quizPercent(7, 10)).toBe(70);
    expect(quizPercent(2, 3)).toBe(67);
    expect(quizPercent(0, 0)).toBeNull();
    expect(quizPercent(12, 10)).toBe(100);
  });

  it('applies the quiz pass mark', () => {
    expect(hasPassedQuiz(7, 10, 70)).toBe(true);
    expect(hasPassedQuiz(6, 10, 70)).toBe(false);
    expect(hasPassedQuiz(0, 0, 70)).toBe(false);
  });
});

describe('lesson locks', () => {
  const lessons = ['one', 'two', 'three'];
  const assessments = {
    one: assessment({ lessonId: 'one', passed: true, bestPercent: 80 }),
    two: assessment({ lessonId: 'two', passed: false, bestPercent: 60 }),
    three: emptyAssessment('three'),
  };

  it('never locks the first lesson', () => {
    expect(isLessonLocked(lessons, 0, assessments)).toBe(false);
  });

  it('locks a lesson until the previous assessment passes', () => {
    expect(isLessonLocked(lessons, 1, assessments)).toBe(false);
    expect(isLessonLocked(lessons, 2, assessments)).toBe(true);
  });

  it('treats lessons without a required quiz as unlocked', () => {
    expect(canAdvanceFrom(emptyAssessment('x'))).toBe(true);
    expect(canAdvanceFrom(assessment({ passed: false }))).toBe(false);
    expect(canAdvanceFrom(assessment({ passed: true }))).toBe(true);
  });
});
