export type Role = 'STUDENT' | 'ADMIN';

export type MediaProvider = 'YOUTUBE' | 'VIMEO' | 'AUDIO_FILE' | 'VIDEO_FILE' | 'NONE';

export type VerificationStatus = 'UNVERIFIED' | 'AVAILABLE' | 'UNAVAILABLE' | 'NEEDS_REVIEW';

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const LEVELS = ['foundation', 'a1', 'a2', 'b1', 'b2', 'c1'] as const;

export type Level = (typeof LEVELS)[number];

export type UiLanguage = 'ar' | 'en';

export type Theme = 'system' | 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/** User shape safe to hand to the client (never includes password hashes). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Media {
  id: string;
  provider: MediaProvider;
  externalId: string | null;
  url: string | null;
  title: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  description: string;
  level: Level;
  /** Curriculum track (1-4) matching the zAmerican English levels. */
  levelGroup: number;
  category: string;
  coverEmoji: string;
  accent: string;
  /** Source YouTube playlist when the course is synchronised from the channel. */
  playlistId: string | null;
  isPublished: boolean;
  position: number;
  lessonCount?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  titleAr: string | null;
  summary: string;
  content: string;
  transcript: string;
  durationMinutes: number;
  position: number;
  mediaId: string | null;
}

export interface LessonWithMedia extends Lesson {
  media: Media | null;
}

export interface LessonProgress {
  lessonId: string;
  status: ProgressStatus;
  positionSeconds: number;
  percent: number;
  updatedAt: string;
  completedAt: string | null;
}

export interface Vocabulary {
  id: string;
  courseId: string | null;
  /** Owning lesson when the word was generated for a specific lesson. */
  lessonId: string | null;
  term: string;
  translation: string;
  partOfSpeech: string;
  phonetic: string | null;
  example: string;
  /** Owner for learner-created words; null for shared/global vocabulary. */
  createdBy: string | null;
}

export interface ReviewCard {
  vocab: Vocabulary;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  level: Level;
  coverEmoji: string;
  summary: string;
  body: string;
  isPublished: boolean;
  questionCount?: number;
}

export interface StoryQuestion {
  id: string;
  storyId: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  position: number;
}

export interface UserSettings {
  dailyGoalMinutes: number;
  theme: Theme;
  uiLanguage: UiLanguage;
}

export interface CourseProgressSummary {
  course: Course;
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

/* ----------------------------- Quizzes ---------------------------- */

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  prompt: string;
  /** Options for MULTIPLE_CHOICE (empty for other types). */
  options: string[];
  /** Correct option index for MULTIPLE_CHOICE. */
  answerIndex: number | null;
  /** Accepted spellings for FILL_BLANK (compared case/whitespace-insensitively). */
  acceptedAnswers: string[];
  /** Correct value for TRUE_FALSE. */
  correctBoolean: boolean | null;
  points: number;
  explanation: string;
  position: number;
}

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  description: string;
  level: Level;
  courseId: string | null;
  lessonId: string | null;
  isPublished: boolean;
  position: number;
  questionCount?: number;
  totalPoints?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  scorePoints: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
  createdAt: string;
}

export interface QuizBestScore {
  scorePoints: number;
  maxPoints: number;
}

/* ------------------------------ Points ---------------------------- */

export type PointsSource = 'LESSON' | 'QUIZ' | 'STORY' | 'REVIEW';

export interface PointsEvent {
  id: string;
  source: PointsSource;
  sourceId: string | null;
  points: number;
  createdAt: string;
}

export interface PointsSummary {
  total: number;
  bySource: Record<PointsSource, number>;
  streak: number;
  levelKey: string;
  levelIndex: number;
  levelMin: number;
  nextLevelAt: number | null;
}
