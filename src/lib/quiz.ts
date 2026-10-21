/**
 * Pure grading logic for quizzes and exercises.
 *
 * Supports multiple-choice, true/false and fill-in-the-blank questions. The API
 * route loads the questions from the database and passes them here, so the
 * client never receives the correct answers.
 */
import type { QuestionType } from './types';

export interface QuizQuestionDef {
  id: string;
  type: QuestionType;
  options: string[];
  answerIndex: number | null;
  acceptedAnswers: string[];
  correctBoolean: boolean | null;
  points: number;
  explanation: string;
}

export interface QuizAnswerInput {
  questionId: string;
  selectedIndex?: number | null;
  booleanAnswer?: boolean | null;
  textAnswer?: string | null;
}

export interface QuizQuestionResult {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  correctIndex: number | null;
  correctBoolean: boolean | null;
  acceptedAnswers: string[];
  explanation: string;
  points: number;
  earned: number;
}

export interface QuizGrade {
  results: QuizQuestionResult[];
  scorePoints: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
}

/** Normalises a fill-in-the-blank answer: trims, lowercases and collapses spaces. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?؟,،]$/g, '')
    .trim();
}

export function isAnswerCorrect(
  question: QuizQuestionDef,
  answer: QuizAnswerInput | undefined,
): boolean {
  if (!answer) return false;
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
      return answer.selectedIndex != null && answer.selectedIndex === question.answerIndex;
    case 'TRUE_FALSE':
      return answer.booleanAnswer != null && answer.booleanAnswer === question.correctBoolean;
    case 'FILL_BLANK': {
      if (!answer.textAnswer) return false;
      const given = normalizeAnswer(answer.textAnswer);
      return given.length > 0 && question.acceptedAnswers.some((a) => normalizeAnswer(a) === given);
    }
    default:
      return false;
  }
}

export function gradeQuiz(questions: QuizQuestionDef[], answers: QuizAnswerInput[]): QuizGrade {
  const byId = new Map(answers.map((answer) => [answer.questionId, answer]));

  const results = questions.map((question) => {
    const correct = isAnswerCorrect(question, byId.get(question.id));
    return {
      questionId: question.id,
      type: question.type,
      correct,
      correctIndex: question.answerIndex,
      correctBoolean: question.correctBoolean,
      acceptedAnswers: question.acceptedAnswers,
      explanation: question.explanation,
      points: question.points,
      earned: correct ? question.points : 0,
    } satisfies QuizQuestionResult;
  });

  const scorePoints = results.reduce((sum, result) => sum + result.earned, 0);
  const maxPoints = results.reduce((sum, result) => sum + result.points, 0);

  return {
    results,
    scorePoints,
    maxPoints,
    correctCount: results.filter((result) => result.correct).length,
    totalQuestions: results.length,
  };
}
