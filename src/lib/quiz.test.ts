import { describe, expect, it } from 'vitest';
import { gradeQuiz, isAnswerCorrect, normalizeAnswer, type QuizQuestionDef } from './quiz';

function question(overrides: Partial<QuizQuestionDef> & Pick<QuizQuestionDef, 'id' | 'type'>): QuizQuestionDef {
  return {
    options: [],
    answerIndex: null,
    acceptedAnswers: [],
    correctBoolean: null,
    points: 1,
    explanation: '',
    ...overrides,
  };
}

describe('normalizeAnswer', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeAnswer('  Hello   World  ')).toBe('hello world');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeAnswer('am.')).toBe('am');
    expect(normalizeAnswer('ready!')).toBe('ready');
  });
});

describe('isAnswerCorrect', () => {
  const mc = question({ id: 'q1', type: 'MULTIPLE_CHOICE', options: ['am', 'is', 'are'], answerIndex: 1 });
  const tf = question({ id: 'q2', type: 'TRUE_FALSE', correctBoolean: true });
  const fill = question({ id: 'q3', type: 'FILL_BLANK', acceptedAnswers: ['am', 'Am'] });

  it('grades multiple choice by index', () => {
    expect(isAnswerCorrect(mc, { questionId: 'q1', selectedIndex: 1 })).toBe(true);
    expect(isAnswerCorrect(mc, { questionId: 'q1', selectedIndex: 0 })).toBe(false);
    expect(isAnswerCorrect(mc, undefined)).toBe(false);
  });

  it('grades true/false by boolean', () => {
    expect(isAnswerCorrect(tf, { questionId: 'q2', booleanAnswer: true })).toBe(true);
    expect(isAnswerCorrect(tf, { questionId: 'q2', booleanAnswer: false })).toBe(false);
  });

  it('grades fill-in-the-blank case/whitespace-insensitively', () => {
    expect(isAnswerCorrect(fill, { questionId: 'q3', textAnswer: '  AM ' })).toBe(true);
    expect(isAnswerCorrect(fill, { questionId: 'q3', textAnswer: 'is' })).toBe(false);
    expect(isAnswerCorrect(fill, { questionId: 'q3', textAnswer: '   ' })).toBe(false);
  });
});

describe('gradeQuiz', () => {
  const questions: QuizQuestionDef[] = [
    question({ id: 'a', type: 'MULTIPLE_CHOICE', options: ['x', 'y'], answerIndex: 1, points: 2 }),
    question({ id: 'b', type: 'TRUE_FALSE', correctBoolean: false, points: 1 }),
    question({ id: 'c', type: 'FILL_BLANK', acceptedAnswers: ['ready'], points: 3 }),
  ];

  it('sums points for correct answers and reports totals', () => {
    const grade = gradeQuiz(questions, [
      { questionId: 'a', selectedIndex: 1 },
      { questionId: 'b', booleanAnswer: false },
      { questionId: 'c', textAnswer: 'ready' },
    ]);
    expect(grade.scorePoints).toBe(6);
    expect(grade.maxPoints).toBe(6);
    expect(grade.correctCount).toBe(3);
    expect(grade.totalQuestions).toBe(3);
    expect(grade.results.every((result) => result.correct)).toBe(true);
  });

  it('treats missing and wrong answers as zero', () => {
    const grade = gradeQuiz(questions, [{ questionId: 'a', selectedIndex: 0 }]);
    expect(grade.scorePoints).toBe(0);
    expect(grade.correctCount).toBe(0);
    expect(grade.results[0].earned).toBe(0);
  });

  it('exposes the answer key for feedback', () => {
    const grade = gradeQuiz(questions, []);
    expect(grade.results[0].correctIndex).toBe(1);
    expect(grade.results[1].correctBoolean).toBe(false);
    expect(grade.results[2].acceptedAnswers).toEqual(['ready']);
  });
});
