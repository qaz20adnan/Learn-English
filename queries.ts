import { all, newId, nowIso, one, run } from './client';
import { computeStreak, levelForPoints } from '../points';
import { DEFAULT_QUIZ_PASS_PERCENT } from '../progression';
import type {
  Course,
  CourseProgressSummary,
  Lesson,
  LessonAssessment,
  LessonProgress,
  LessonWithMedia,
  Level,
  Media,
  MediaProvider,
  PointsEvent,
  PointsSource,
  PointsSummary,
  ProgressStatus,
  PublicUser,
  QuestionType,
  Quiz,
  QuizAttempt,
  QuizBestScore,
  QuizQuestion,
  ReviewCard,
  Role,
  Story,
  StoryQuestion,
  Theme,
  UiLanguage,
  User,
  UserSettings,
  VerificationStatus,
  Vocabulary,
} from '../types';

/* ------------------------------------------------------------------ */
/* Row types (snake_case shapes returned by SQL)                       */
/* ------------------------------------------------------------------ */

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

interface MediaRow {
  id: string;
  provider: MediaProvider;
  external_id: string | null;
  url: string | null;
  title: string | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  source_url: string | null;
  last_checked_at: string | null;
}

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  description: string;
  level: Level;
  level_group: number;
  category: string;
  cover_emoji: string;
  accent: string;
  playlist_id: string | null;
  is_published: number;
  position: number;
  lesson_count?: number;
}

interface LessonRow {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  summary: string;
  content: string;
  transcript: string;
  duration_minutes: number;
  position: number;
  media_id: string | null;
}

interface ProgressRow {
  lesson_id: string;
  status: ProgressStatus;
  position_seconds: number;
  percent: number;
  updated_at: string;
  completed_at: string | null;
}

interface VocabularyRow {
  id: string;
  course_id: string | null;
  lesson_id: string | null;
  term: string;
  translation: string;
  part_of_speech: string;
  phonetic: string | null;
  example: string;
  created_by: string | null;
}

interface ReviewRow extends VocabularyRow {
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
}

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  level: Level;
  cover_emoji: string;
  summary: string;
  body: string;
  is_published: number;
  position: number;
  question_count?: number;
}

interface StoryQuestionRow {
  id: string;
  story_id: string;
  prompt: string;
  options: string;
  answer_index: number;
  explanation: string;
  position: number;
}

interface SettingsRow {
  daily_goal_minutes: number;
  theme: Theme;
  ui_language: UiLanguage;
}

interface SessionRow {
  user_id: string;
  expires_at: string;
}

interface QuizRow {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  description: string;
  level: Level;
  course_id: string | null;
  lesson_id: string | null;
  is_published: number;
  position: number;
  pass_percent: number;
  question_count?: number;
  total_points?: number;
}

interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  type: QuestionType;
  prompt: string;
  options: string;
  answer_index: number | null;
  accepted_answers: string;
  correct_boolean: number | null;
  points: number;
  explanation: string;
  position: number;
}

interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  score_points: number;
  max_points: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
}

interface QuizSessionRow {
  id: string;
  user_id: string;
  quiz_id: string;
  question_ids: string;
  created_at: string;
  expires_at: string;
}

interface PointsRow {
  id: string;
  source: PointsSource;
  source_id: string | null;
  points: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

function toMedia(row: MediaRow): Media {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.external_id,
    url: row.url,
    title: row.title,
    verificationStatus: row.verification_status,
    verificationNote: row.verification_note,
    sourceUrl: row.source_url,
    lastCheckedAt: row.last_checked_at,
  };
}

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAr: row.title_ar,
    description: row.description,
    level: row.level,
    levelGroup: row.level_group,
    category: row.category,
    coverEmoji: row.cover_emoji,
    accent: row.accent,
    playlistId: row.playlist_id,
    isPublished: row.is_published === 1,
    position: row.position,
    lessonCount: row.lesson_count,
  };
}

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    slug: row.slug,
    title: row.title,
    titleAr: row.title_ar,
    summary: row.summary,
    content: row.content,
    transcript: row.transcript,
    durationMinutes: row.duration_minutes,
    position: row.position,
    mediaId: row.media_id,
  };
}

function toVocabulary(row: VocabularyRow): Vocabulary {
  return {
    id: row.id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    term: row.term,
    translation: row.translation,
    partOfSpeech: row.part_of_speech,
    phonetic: row.phonetic,
    example: row.example,
    createdBy: row.created_by,
  };
}

function toQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAr: row.title_ar,
    description: row.description,
    level: row.level,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    isPublished: row.is_published === 1,
    position: row.position,
    passPercent: row.pass_percent ?? DEFAULT_QUIZ_PASS_PERCENT,
    questionCount: row.question_count,
    totalPoints: row.total_points,
  };
}

function toQuizQuestion(row: QuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    quizId: row.quiz_id,
    type: row.type,
    prompt: row.prompt,
    options: JSON.parse(row.options) as string[],
    answerIndex: row.answer_index,
    acceptedAnswers: JSON.parse(row.accepted_answers) as string[],
    correctBoolean: row.correct_boolean === null ? null : row.correct_boolean === 1,
    points: row.points,
    explanation: row.explanation,
    position: row.position,
  };
}

function toQuizAttempt(row: QuizAttemptRow): QuizAttempt {
  return {
    id: row.id,
    quizId: row.quiz_id,
    scorePoints: row.score_points,
    maxPoints: row.max_points,
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
  };
}

function toStory(row: StoryRow): Story {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAr: row.title_ar,
    level: row.level,
    coverEmoji: row.cover_emoji,
    summary: row.summary,
    body: row.body,
    isPublished: row.is_published === 1,
    questionCount: row.question_count,
  };
}

/* ------------------------------------------------------------------ */
/* Users & settings                                                    */
/* ------------------------------------------------------------------ */

export async function countUsers(): Promise<number> {
  const row = await one<{ c: number }>('SELECT COUNT(*)::int AS c FROM users');
  return row?.c ?? 0;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}): Promise<PublicUser> {
  const id = newId('usr');
  const ts = nowIso();
  await run(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.email.toLowerCase(),
    input.name,
    input.passwordHash,
    input.role ?? 'STUDENT',
    ts,
    ts,
  );
  return { id, email: input.email.toLowerCase(), name: input.name, role: input.role ?? 'STUDENT' };
}

export async function findUserWithSecret(
  email: string,
): Promise<{ user: PublicUser; passwordHash: string } | null> {
  const row = await one<UserRow>('SELECT * FROM users WHERE email = ?', email.toLowerCase());
  if (!row) return null;
  return { user: toPublicUser(row), passwordHash: row.password_hash };
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await one<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ? toUser(row) : null;
}

export async function listUsers(): Promise<User[]> {
  const rows = await all<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(toUser);
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', role, nowIso(), userId);
}

export async function deleteUser(userId: string): Promise<void> {
  await run('DELETE FROM users WHERE id = ?', userId);
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const row = await one<SettingsRow>(
    'SELECT daily_goal_minutes, theme, ui_language FROM user_settings WHERE user_id = ?',
    userId,
  );
  if (!row) {
    await ensureSettings(userId);
    return { dailyGoalMinutes: 15, theme: 'system', uiLanguage: 'ar' };
  }
  return {
    dailyGoalMinutes: row.daily_goal_minutes,
    theme: row.theme,
    uiLanguage: row.ui_language,
  };
}

export async function ensureSettings(userId: string): Promise<void> {
  await run(
    `INSERT INTO user_settings (user_id, daily_goal_minutes, theme, ui_language, updated_at)
     VALUES (?, 15, 'system', 'ar', ?)
     ON CONFLICT(user_id) DO NOTHING`,
    userId,
    nowIso(),
  );
}

export async function updateSettings(
  userId: string,
  patch: Partial<UserSettings>,
): Promise<UserSettings> {
  const current = await getSettings(userId);
  const next: UserSettings = { ...current, ...patch };
  await run(
    `UPDATE user_settings
     SET daily_goal_minutes = ?, theme = ?, ui_language = ?, updated_at = ?
     WHERE user_id = ?`,
    next.dailyGoalMinutes,
    next.theme,
    next.uiLanguage,
    nowIso(),
    userId,
  );
  return next;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export async function createSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent?: string | null;
}): Promise<void> {
  await run(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    newId('ses'),
    input.userId,
    input.tokenHash,
    input.userAgent ?? null,
    input.expiresAt,
    nowIso(),
  );
}

export async function findSession(
  tokenHash: string,
): Promise<{ userId: string; expiresAt: string } | null> {
  const row = await one<SessionRow>(
    'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?',
    tokenHash,
  );
  if (!row) return null;
  return { userId: row.user_id, expiresAt: row.expires_at };
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await run('DELETE FROM sessions WHERE token_hash = ?', tokenHash);
}

export async function deleteExpiredSessions(): Promise<void> {
  await run('DELETE FROM sessions WHERE expires_at < ?', nowIso());
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export async function listMedia(): Promise<Media[]> {
  const rows = await all<MediaRow>('SELECT * FROM media ORDER BY created_at DESC');
  return rows.map(toMedia);
}

export async function getMediaById(id: string): Promise<Media | null> {
  const row = await one<MediaRow>('SELECT * FROM media WHERE id = ?', id);
  return row ? toMedia(row) : null;
}

export async function updateMediaVerification(
  id: string,
  status: VerificationStatus,
  note: string | null,
): Promise<void> {
  await run(
    `UPDATE media
     SET verification_status = ?, verification_note = ?, last_checked_at = ?, updated_at = ?
     WHERE id = ?`,
    status,
    note,
    nowIso(),
    nowIso(),
    id,
  );
}

/* ------------------------------------------------------------------ */
/* Playback failures (T10)                                             */
/* ------------------------------------------------------------------ */

/**
 * Records a runtime playback failure reported by an in-page player.
 *
 * Returns `false` when the exact same failure (user + media + code) was
 * already recorded in the last 10 minutes — page refreshes and player
 * remounts would otherwise flood the reliability board. The media row must
 * exist (FK enforced); the API resolves this before calling.
 */
export async function recordPlaybackFailure(input: {
  userId: string;
  mediaId: string;
  provider: MediaProvider;
  errorCode: number | null;
  note?: string;
}): Promise<boolean> {
  const dedupeWindow = 10 * 60 * 1000;
  const since = new Date(Date.now() - dedupeWindow).toISOString();

  const existing = await one<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM playback_failures
     WHERE user_id = ? AND media_id = ? AND COALESCE(error_code, -1) = COALESCE(?, -1)
       AND created_at >= ?`,
    input.userId,
    input.mediaId,
    input.errorCode,
    since,
  );
  if ((existing?.c ?? 0) > 0) return false;

  await run(
    `INSERT INTO playback_failures (id, user_id, media_id, provider, error_code, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('pbf'),
    input.userId,
    input.mediaId,
    input.provider,
    input.errorCode,
    input.note ?? '',
    nowIso(),
  );
  return true;
}

/**
 * Aggregated playback failures for the admin reliability board: how many
 * distinct failures per media in the given window (ISO timestamp).
 */
export async function listRecentPlaybackFailures(sinceIso: string) {
  const rows = await all<{
    media_id: string;
    provider: MediaProvider;
    title: string | null;
    url: string | null;
    external_id: string | null;
    failure_count: number;
    last_failure_at: string;
    last_error_code: number | null;
  }>(
    `SELECT f.media_id,
            m.provider,
            m.title,
            m.url,
            m.external_id,
            COUNT(*)::int AS failure_count,
            MAX(f.created_at) AS last_failure_at,
            (ARRAY_AGG(f.error_code ORDER BY f.created_at DESC))[1] AS last_error_code
     FROM playback_failures f
     JOIN media m ON m.id = f.media_id
     WHERE f.created_at >= ?
     GROUP BY f.media_id, m.provider, m.title, m.url, m.external_id
     ORDER BY failure_count DESC, last_failure_at DESC
     LIMIT 100`,
    sinceIso,
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* Courses & lessons                                                   */
/* ------------------------------------------------------------------ */

export async function listCourses(includeUnpublished = false): Promise<Course[]> {
  const rows = await all<CourseRow>(
    `SELECT c.*, (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id) AS lesson_count
     FROM courses c
     ${includeUnpublished ? '' : 'WHERE c.is_published = 1'}
     ORDER BY c.position ASC, c.title ASC`,
  );
  return rows.map(toCourse);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const row = await one<CourseRow>('SELECT * FROM courses WHERE slug = ?', slug);
  return row ? toCourse(row) : null;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const row = await one<CourseRow>('SELECT * FROM courses WHERE id = ?', id);
  return row ? toCourse(row) : null;
}

export async function listLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const rows = await all<LessonRow>(
    'SELECT * FROM lessons WHERE course_id = ? ORDER BY position ASC',
    courseId,
  );
  return rows.map(toLesson);
}

export async function getLessonBySlug(
  courseId: string,
  slug: string,
): Promise<LessonWithMedia | null> {
  const row = await one<LessonRow>(
    'SELECT * FROM lessons WHERE course_id = ? AND slug = ?',
    courseId,
    slug,
  );
  if (!row) return null;
  const media = row.media_id ? await getMediaById(row.media_id) : null;
  return { ...toLesson(row), media };
}

export async function getLessonById(id: string): Promise<LessonWithMedia | null> {
  const row = await one<LessonRow>('SELECT * FROM lessons WHERE id = ?', id);
  if (!row) return null;
  const media = row.media_id ? await getMediaById(row.media_id) : null;
  return { ...toLesson(row), media };
}

export async function countLessonsByCourse(courseId: string): Promise<number> {
  const row = await one<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM lessons WHERE course_id = ?',
    courseId,
  );
  return row?.c ?? 0;
}

/* ------------------------------------------------------------------ */
/* Lesson progress                                                     */
/* ------------------------------------------------------------------ */

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  const row = await one<ProgressRow>(
    'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
    userId,
    lessonId,
  );
  if (!row) return null;
  return {
    lessonId: row.lesson_id,
    status: row.status,
    positionSeconds: row.position_seconds,
    percent: row.percent,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function saveLessonProgress(input: {
  userId: string;
  lessonId: string;
  positionSeconds: number;
  percent: number;
  status: ProgressStatus;
}): Promise<LessonProgress> {
  const ts = nowIso();
  const completedAt = input.status === 'COMPLETED' ? ts : null;
  await run(
    `INSERT INTO lesson_progress
       (id, user_id, lesson_id, status, position_seconds, percent, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       status = excluded.status,
       position_seconds = excluded.position_seconds,
       percent = GREATEST(lesson_progress.percent, excluded.percent),
       updated_at = excluded.updated_at,
       completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at)`,
    newId('prg'),
    input.userId,
    input.lessonId,
    input.status,
    Math.max(0, Math.round(input.positionSeconds)),
    Math.min(100, Math.max(0, Math.round(input.percent))),
    ts,
    completedAt,
  );
  const saved = await getLessonProgress(input.userId, input.lessonId);
  if (!saved) throw new Error('Failed to save lesson progress');
  return saved;
}

export async function listCourseProgress(
  userId: string,
  courseId: string,
): Promise<Record<string, LessonProgress>> {
  const rows = await all<ProgressRow>(
    `SELECT p.* FROM lesson_progress p
     JOIN lessons l ON l.id = p.lesson_id
     WHERE p.user_id = ? AND l.course_id = ?`,
    userId,
    courseId,
  );
  const map: Record<string, LessonProgress> = {};
  for (const row of rows) {
    map[row.lesson_id] = {
      lessonId: row.lesson_id,
      status: row.status,
      positionSeconds: row.position_seconds,
      percent: row.percent,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }
  return map;
}

export async function getCourseProgressSummaries(
  userId: string,
): Promise<CourseProgressSummary[]> {
  const courses = await listCourses();
  return Promise.all(
    courses.map(async (course) => {
      const row = await one<{ total: number; completed: number | null }>(
        `SELECT
           COUNT(l.id)::int AS total,
           SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END)::int AS completed
         FROM lessons l
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
         WHERE l.course_id = ?`,
        userId,
        course.id,
      );
      const total = row?.total ?? 0;
      const completed = row?.completed ?? 0;
      return {
        course,
        totalLessons: total,
        completedLessons: completed,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      };
    }),
  );
}

export interface LearningStats {
  lessonsCompleted: number;
  lessonsInProgress: number;
  minutesLearned: number;
  coursesStarted: number;
  vocabularyTracked: number;
  reviewsDue: number;
}

export async function getLearningStats(userId: string): Promise<LearningStats> {
  const [completed, inProgress, started, vocab, due] = await Promise.all([
    one<{ c: number; m: number }>(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(l.duration_minutes), 0)::int AS m
       FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = ? AND p.status = 'COMPLETED'`,
      userId,
    ),
    one<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM lesson_progress WHERE user_id = ? AND status = 'IN_PROGRESS'`,
      userId,
    ),
    one<{ c: number }>(
      `SELECT COUNT(DISTINCT l.course_id)::int AS c
       FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = ?`,
      userId,
    ),
    one<{ c: number }>('SELECT COUNT(*)::int AS c FROM vocab_review WHERE user_id = ?', userId),
    one<{ c: number }>(
      'SELECT COUNT(*)::int AS c FROM vocab_review WHERE user_id = ? AND due_at <= ?',
      userId,
      nowIso(),
    ),
  ]);

  return {
    lessonsCompleted: completed?.c ?? 0,
    lessonsInProgress: inProgress?.c ?? 0,
    minutesLearned: completed?.m ?? 0,
    coursesStarted: started?.c ?? 0,
    vocabularyTracked: vocab?.c ?? 0,
    reviewsDue: due?.c ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Vocabulary & spaced repetition                                      */
/* ------------------------------------------------------------------ */

export interface VocabularyQuery {
  courseId?: string;
  /** Maximum number of rows to return (random sample). */
  limit?: number;
}

/** Shared (non user-owned) vocabulary — the public word bank, randomly ordered. */
export async function listVocabulary(options: VocabularyQuery = {}): Promise<Vocabulary[]> {
  const clauses = ['created_by IS NULL'];
  const params: (string | number)[] = [];
  if (options.courseId) {
    clauses.push('course_id = ?');
    params.push(options.courseId);
  }
  let sql = `SELECT * FROM vocabulary WHERE ${clauses.join(' AND ')} ORDER BY RANDOM()`;
  if (options.limit && options.limit > 0) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  const rows = await all<VocabularyRow>(sql, ...params);
  return rows.map(toVocabulary);
}

/** Number of words in the shared bank (the whole bank, before any sampling). */
export async function countVocabulary(courseId?: string): Promise<number> {
  const row = courseId
    ? await one<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM vocabulary WHERE created_by IS NULL AND course_id = ?',
        courseId,
      )
    : await one<{ c: number }>(
        'SELECT COUNT(*)::int AS c FROM vocabulary WHERE created_by IS NULL',
      );
  return row?.c ?? 0;
}

/** Words created by a single learner ("my saved words"). */
export async function listUserVocabulary(userId: string): Promise<Vocabulary[]> {
  const rows = await all<VocabularyRow>(
    'SELECT * FROM vocabulary WHERE created_by = ? ORDER BY created_at DESC',
    userId,
  );
  return rows.map(toVocabulary);
}

export async function countUserVocabulary(userId: string): Promise<number> {
  const row = await one<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM vocabulary WHERE created_by = ?',
    userId,
  );
  return row?.c ?? 0;
}

export async function getVocabularyById(id: string): Promise<Vocabulary | null> {
  const row = await one<VocabularyRow>('SELECT * FROM vocabulary WHERE id = ?', id);
  return row ? toVocabulary(row) : null;
}

/**
 * Look up a word only if the learner is allowed to see it: either a word from
 * the shared bank or one they created themselves. Used by endpoints that accept
 * a vocabulary id from the client so one account cannot reference another
 * account's private words.
 */
export async function getVocabularyForUser(
  userId: string,
  vocabId: string,
): Promise<Vocabulary | null> {
  const row = await one<VocabularyRow>(
    'SELECT * FROM vocabulary WHERE id = ? AND (created_by IS NULL OR created_by = ?)',
    vocabId,
    userId,
  );
  return row ? toVocabulary(row) : null;
}

export async function createVocabulary(input: {
  courseId?: string | null;
  lessonId?: string | null;
  term: string;
  translation: string;
  partOfSpeech?: string;
  phonetic?: string | null;
  example?: string;
  createdBy?: string | null;
}): Promise<Vocabulary> {
  const id = newId('voc');
  await run(
    `INSERT INTO vocabulary (id, course_id, lesson_id, term, translation, part_of_speech, phonetic, example, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.courseId ?? null,
    input.lessonId ?? null,
    input.term,
    input.translation,
    input.partOfSpeech ?? 'noun',
    input.phonetic ?? null,
    input.example ?? '',
    input.createdBy ?? null,
    nowIso(),
  );
  const created = await getVocabularyById(id);
  if (!created) throw new Error('Failed to create vocabulary');
  return created;
}

/** Vocabulary attached to a single lesson (via the shared word bank). */
export async function listLessonVocabulary(lessonId: string): Promise<Vocabulary[]> {
  const rows = await all<VocabularyRow>(
    `SELECT v.* FROM vocabulary v
     JOIN lesson_vocabulary lv ON lv.vocab_id = v.id
     WHERE lv.lesson_id = ?
     ORDER BY lv.position ASC, v.term ASC`,
    lessonId,
  );
  return rows.map(toVocabulary);
}

/* ------------------------------------------------------------------ */
/* Favorites                                                           */
/* ------------------------------------------------------------------ */

export async function addFavorite(userId: string, vocabId: string): Promise<void> {
  await run(
    `INSERT INTO vocab_favorites (id, user_id, vocab_id, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, vocab_id) DO NOTHING`,
    newId('fav'),
    userId,
    vocabId,
    nowIso(),
  );
}

export async function removeFavorite(userId: string, vocabId: string): Promise<void> {
  await run('DELETE FROM vocab_favorites WHERE user_id = ? AND vocab_id = ?', userId, vocabId);
}

export async function isFavorite(userId: string, vocabId: string): Promise<boolean> {
  const row = await one<{ ok: number }>(
    'SELECT 1 AS ok FROM vocab_favorites WHERE user_id = ? AND vocab_id = ?',
    userId,
    vocabId,
  );
  return Boolean(row);
}

/**
 * A learner's favorites list: words they bookmarked from the shared bank plus
 * every word they created themselves.
 */
export async function listFavoriteVocabulary(userId: string): Promise<Vocabulary[]> {
  const rows = await all<VocabularyRow>(
    `SELECT v.* FROM vocabulary v
     LEFT JOIN vocab_favorites f ON f.vocab_id = v.id AND f.user_id = ?
     WHERE (f.id IS NOT NULL AND (v.created_by IS NULL OR v.created_by = ?))
        OR v.created_by = ?
     ORDER BY v.term`,
    userId,
    userId,
    userId,
  );
  return rows.map(toVocabulary);
}

export async function countFavorites(userId: string): Promise<number> {
  const row = await one<{ c: number }>(
    `SELECT (
       (SELECT COUNT(*) FROM vocab_favorites f
        JOIN vocabulary v ON v.id = f.vocab_id
        WHERE f.user_id = ? AND (v.created_by IS NULL OR v.created_by = ?)) +
       (SELECT COUNT(*) FROM vocabulary WHERE created_by = ?)
     )::int AS c`,
    userId,
    userId,
    userId,
  );
  return row?.c ?? 0;
}

export async function listFavoriteIds(userId: string): Promise<string[]> {
  const rows = await all<{ vocab_id: string }>(
    `SELECT f.vocab_id FROM vocab_favorites f
     JOIN vocabulary v ON v.id = f.vocab_id
     WHERE f.user_id = ? AND (v.created_by IS NULL OR v.created_by = ?)`,
    userId,
    userId,
  );
  return rows.map((row) => row.vocab_id);
}

/* ------------------------------------------------------------------ */
/* Spaced repetition tracking                                          */
/* ------------------------------------------------------------------ */

/** Creates review rows for shared words plus the learner's own words. */
export async function ensureReviewEntries(userId: string): Promise<void> {
  await run(
    `INSERT INTO vocab_review (id, user_id, vocab_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at)
     SELECT 'rev_' || substr(md5(random()::text), 1, 16), ?, v.id, 2.5, 0, 0, 0, ?, NULL
     FROM vocabulary v
     WHERE (v.created_by IS NULL OR v.created_by = ?)
       AND NOT EXISTS (
         SELECT 1 FROM vocab_review r WHERE r.user_id = ? AND r.vocab_id = v.id
       )`,
    userId,
    nowIso(),
    userId,
    userId,
  );
}

export async function listDueCards(userId: string, limit = 20): Promise<ReviewCard[]> {
  await ensureReviewEntries(userId);
  const rows = await all<ReviewRow>(
    `SELECT v.*, r.ease, r.interval_days, r.repetitions, r.lapses, r.due_at, r.last_reviewed_at
     FROM vocab_review r JOIN vocabulary v ON v.id = r.vocab_id
     WHERE r.user_id = ? AND r.due_at <= ?
     ORDER BY r.due_at ASC
     LIMIT ?`,
    userId,
    nowIso(),
    limit,
  );
  return rows.map((row) => ({
    vocab: toVocabulary(row),
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
  }));
}

export async function getReviewCard(userId: string, vocabId: string): Promise<ReviewCard | null> {
  const row = await one<ReviewRow>(
    `SELECT v.*, r.ease, r.interval_days, r.repetitions, r.lapses, r.due_at, r.last_reviewed_at
     FROM vocab_review r JOIN vocabulary v ON v.id = r.vocab_id
     WHERE r.user_id = ? AND r.vocab_id = ?`,
    userId,
    vocabId,
  );
  if (!row) return null;
  return {
    vocab: toVocabulary(row),
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export async function saveReviewState(input: {
  userId: string;
  vocabId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
}): Promise<void> {
  await run(
    `INSERT INTO vocab_review
       (id, user_id, vocab_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, vocab_id) DO UPDATE SET
       ease = excluded.ease,
       interval_days = excluded.interval_days,
       repetitions = excluded.repetitions,
       lapses = excluded.lapses,
       due_at = excluded.due_at,
       last_reviewed_at = excluded.last_reviewed_at`,
    newId('rev'),
    input.userId,
    input.vocabId,
    input.ease,
    input.intervalDays,
    input.repetitions,
    input.lapses,
    input.dueAt,
    nowIso(),
  );
}

export async function countDueReviews(userId: string): Promise<number> {
  await ensureReviewEntries(userId);
  const row = await one<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM vocab_review WHERE user_id = ? AND due_at <= ?',
    userId,
    nowIso(),
  );
  return row?.c ?? 0;
}

/* ------------------------------------------------------------------ */
/* Stories & quizzes                                                   */
/* ------------------------------------------------------------------ */

export async function listStories(): Promise<Story[]> {
  const rows = await all<StoryRow>(
    `SELECT s.*, (SELECT COUNT(*)::int FROM story_questions q WHERE q.story_id = s.id) AS question_count
     FROM stories s WHERE s.is_published = 1 ORDER BY s.position ASC, s.title ASC`,
  );
  return rows.map(toStory);
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const row = await one<StoryRow>('SELECT * FROM stories WHERE slug = ?', slug);
  return row ? toStory(row) : null;
}

export async function listStoryQuestions(storyId: string): Promise<StoryQuestion[]> {
  const rows = await all<StoryQuestionRow>(
    'SELECT * FROM story_questions WHERE story_id = ? ORDER BY position ASC',
    storyId,
  );
  return rows.map((row) => ({
    id: row.id,
    storyId: row.story_id,
    prompt: row.prompt,
    options: JSON.parse(row.options) as string[],
    answerIndex: row.answer_index,
    explanation: row.explanation,
    position: row.position,
  }));
}

export async function saveStoryAttempt(input: {
  userId: string;
  storyId: string;
  score: number;
  total: number;
  answers: number[];
}): Promise<void> {
  await run(
    `INSERT INTO story_attempts (id, user_id, story_id, score, total, answers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('att'),
    input.userId,
    input.storyId,
    input.score,
    input.total,
    JSON.stringify(input.answers),
    nowIso(),
  );
}

export async function getBestStoryScore(
  userId: string,
  storyId: string,
): Promise<number | null> {
  const row = await one<{ best: number | null }>(
    'SELECT MAX(score) AS best FROM story_attempts WHERE user_id = ? AND story_id = ?',
    userId,
    storyId,
  );
  return row?.best ?? null;
}

/* ------------------------------------------------------------------ */
/* Quizzes & exercises                                                 */
/* ------------------------------------------------------------------ */

const QUIZ_COUNT_COLUMNS = `(SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
       (SELECT COALESCE(SUM(qq.points), 0)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS total_points`;

export async function listQuizzes(): Promise<Quiz[]> {
  const rows = await all<QuizRow>(
    `SELECT q.*, ${QUIZ_COUNT_COLUMNS}
     FROM quizzes q
     WHERE q.is_published = 1
       AND (q.course_id IS NULL OR EXISTS (
         SELECT 1 FROM courses c WHERE c.id = q.course_id AND c.is_published = 1
       ))
     ORDER BY q.position ASC, q.title ASC`,
  );
  return rows.map(toQuiz);
}

/* ------------------------------------------------------------------ */
/* Quizzes library: search / filters / pagination (T3)                 */
/* ------------------------------------------------------------------ */

export type QuizStatusFilter = 'all' | 'passed' | 'remaining';

export interface QuizListFilters {
  /** Free-text search across title, Arabic title and description. */
  q?: string;
  /** Exact CEFR level (foundation/a1/a2/b1/b2/c1). */
  level?: string;
  /**
   * `passed` → best attempt ratio ≥ pass threshold.
   * `remaining` → never attempted, or attempted below the threshold.
   */
  status?: QuizStatusFilter;
  page: number;
  pageSize: number;
}

export interface QuizListPage {
  items: Quiz[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface QuizPageRow extends QuizRow {
  best_ratio: number | null;
}

function quizSearchClause(q: string): string {
  const like = `%${q.toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  return like;
}

/**
 * Paginated, filterable quiz library listing.
 *
 * The learner's best attempt ratio (max of score/max across attempts) is joined
 * per quiz so the `passed` / `remaining` filters reflect *this* user's real
 * progress — same definition the dashboard and quiz pages use.
 *
 * Placeholders are written as explicit `$n` on purpose: the same parameter is
 * referenced several times ($1 user id in both aggregates, $2 search term in
 * three columns), and the `?`-to-`$n` shim in db/client.ts numbers purely by
 * occurrence, which cannot express reuse.
 */
export async function listQuizzesPaged(
  userId: string,
  filters: QuizListFilters,
): Promise<QuizListPage> {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(filters.pageSize) || 24));

  const params: unknown[] = [userId];
  const conds: string[] = [
    'q.is_published = 1',
    `(q.course_id IS NULL OR EXISTS (
       SELECT 1 FROM courses c WHERE c.id = q.course_id AND c.is_published = 1
     ))`,
  ];

  const q = filters.q?.trim();
  if (q) {
    params.push(quizSearchClause(q));
    conds.push(
      "(LOWER(q.title) LIKE $2 OR LOWER(COALESCE(q.title_ar, '')) LIKE $2 OR LOWER(q.description) LIKE $2)",
    );
  }

  if (filters.level) {
    params.push(filters.level);
    conds.push(`q.level = $${params.length}`);
  }

  const status = filters.status ?? 'all';
  if (status === 'passed') {
    conds.push('(ba.best_ratio IS NOT NULL AND ba.best_ratio * 100 >= q.pass_percent)');
  } else if (status === 'remaining') {
    conds.push('(ba.best_ratio IS NULL OR ba.best_ratio * 100 < q.pass_percent)');
  }

  const where = conds.join('\n   AND ');
  const joins = `LEFT JOIN (
       SELECT quiz_id, MAX(score_points * 1.0 / NULLIF(max_points, 0)) AS best_ratio
       FROM quiz_attempts WHERE user_id = $1
       GROUP BY quiz_id
     ) ba ON ba.quiz_id = q.id`;

  const totalRow = await one<{ c: number }>(
    `SELECT COUNT(*)::int AS c
     FROM quizzes q
     ${joins}
     WHERE ${where}`,
    ...params,
  );
  const total = totalRow?.c ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  params.push(pageSize, (safePage - 1) * pageSize);
  const limitN = params.length - 1;
  const offsetN = params.length;

  const rows = await all<QuizPageRow>(
    `SELECT q.*, ${QUIZ_COUNT_COLUMNS}, ba.best_ratio
     FROM quizzes q
     ${joins}
     WHERE ${where}
     ORDER BY q.position ASC, q.title ASC
     LIMIT $${limitN} OFFSET $${offsetN}`,
    ...params,
  );

  return { items: rows.map(toQuiz), total, page: safePage, pageSize, totalPages };
}

export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const row = await one<QuizRow>(
    `SELECT q.*, ${QUIZ_COUNT_COLUMNS} FROM quizzes q
     WHERE q.slug = ?
       AND (q.course_id IS NULL OR EXISTS (
         SELECT 1 FROM courses c WHERE c.id = q.course_id AND c.is_published = 1
       ))`,
    slug,
  );
  return row ? toQuiz(row) : null;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const row = await one<QuizRow>(
    `SELECT q.*, ${QUIZ_COUNT_COLUMNS} FROM quizzes q
     WHERE q.id = ?
       AND (q.course_id IS NULL OR EXISTS (
         SELECT 1 FROM courses c WHERE c.id = q.course_id AND c.is_published = 1
       ))`,
    id,
  );
  return row ? toQuiz(row) : null;
}

export async function getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
  const row = await one<QuizRow>(
    `SELECT q.*, ${QUIZ_COUNT_COLUMNS}
     FROM quizzes q WHERE q.lesson_id = ? AND q.is_published = 1
     ORDER BY q.position ASC LIMIT 1`,
    lessonId,
  );
  return row ? toQuiz(row) : null;
}

export async function listQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const rows = await all<QuizQuestionRow>(
    'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC',
    quizId,
  );
  return rows.map(toQuizQuestion);
}

/**
 * Load only the questions that belong to a stored session, preserving the
 * random order the learner received. The endpoint never trusts question ids
 * sent by the browser.
 */
export async function listQuizQuestionsByIds(
  quizId: string,
  questionIds: string[],
): Promise<QuizQuestion[]> {
  if (questionIds.length === 0) return [];
  const questions = await listQuizQuestions(quizId);
  const byId = new Map(questions.map((question) => [question.id, question]));
  return questionIds
    .map((id) => byId.get(id))
    .filter((question): question is QuizQuestion => Boolean(question));
}

/**
 * The assessment state used for unlocking. A lesson without a quiz is always
 * considered passed, while a quiz is passed only when the learner's best
 * percentage reaches the quiz threshold.
 */
export async function getLessonAssessment(
  userId: string,
  lessonId: string,
): Promise<LessonAssessment> {
  const quiz = await getQuizByLessonId(lessonId);
  if (!quiz) {
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

  const row = await one<{ attempts: number; best_percent: number | null }>(
    `SELECT COUNT(*)::int AS attempts,
            ROUND(MAX(CASE WHEN max_points > 0 THEN score_points * 100.0 / max_points ELSE 0 END))::int AS best_percent
     FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
    userId,
    quiz.id,
  );
  const bestPercent = row?.best_percent ?? null;
  return {
    lessonId,
    quizId: quiz.id,
    quizSlug: quiz.slug,
    quizTitle: quiz.titleAr ?? quiz.title,
    required: true,
    passed: bestPercent !== null && bestPercent >= quiz.passPercent,
    passPercent: quiz.passPercent,
    bestPercent,
    attempts: row?.attempts ?? 0,
  };
}

/**
 * Batch version used by the course and lesson pages so a course with hundreds
 * of lessons still needs one query instead of one per lesson.
 */
export async function listCourseAssessments(
  userId: string,
  courseId: string,
): Promise<Record<string, LessonAssessment>> {
  const rows = await all<{
    lesson_id: string;
    quiz_id: string | null;
    quiz_slug: string | null;
    quiz_title: string | null;
    pass_percent: number | null;
    attempts: number;
    best_percent: number | null;
  }>(
    `SELECT l.id AS lesson_id,
            q.id AS quiz_id,
            q.slug AS quiz_slug,
            COALESCE(q.title_ar, q.title) AS quiz_title,
            q.pass_percent,
            COUNT(qa.id)::int AS attempts,
            ROUND(MAX(CASE WHEN qa.max_points > 0 THEN qa.score_points * 100.0 / qa.max_points ELSE 0 END))::int AS best_percent
     FROM lessons l
     LEFT JOIN quizzes q ON q.lesson_id = l.id AND q.is_published = 1
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.user_id = ?
     WHERE l.course_id = ?
     GROUP BY l.id, l.position, q.id, q.slug, q.title, q.title_ar, q.pass_percent, q.position
     ORDER BY l.position ASC, q.position ASC`,
    userId,
    courseId,
  );

  const map: Record<string, LessonAssessment> = {};
  for (const row of rows) {
    const existing = map[row.lesson_id];
    if (existing?.quizId && !row.quiz_id) continue;
    if (!row.quiz_id) {
      map[row.lesson_id] = {
        lessonId: row.lesson_id,
        quizId: null,
        quizSlug: null,
        quizTitle: null,
        required: false,
        passed: true,
        passPercent: DEFAULT_QUIZ_PASS_PERCENT,
        bestPercent: null,
        attempts: 0,
      };
      continue;
    }
    const passPercent = row.pass_percent ?? DEFAULT_QUIZ_PASS_PERCENT;
    const bestPercent = row.best_percent ?? null;
    map[row.lesson_id] = {
      lessonId: row.lesson_id,
      quizId: row.quiz_id,
      quizSlug: row.quiz_slug,
      quizTitle: row.quiz_title,
      required: true,
      passed: bestPercent !== null && bestPercent >= passPercent,
      passPercent,
      bestPercent,
      attempts: row.attempts,
    };
  }
  return map;
}

export interface QuizSessionRecord {
  id: string;
  quizId: string;
  questionIds: string[];
  createdAt: string;
  expiresAt: string;
}

export interface QuizSessionPayload extends QuizSessionRecord {
  questions: QuizQuestion[];
}

const QUIZ_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Draw a fresh random set of questions and persist exactly which ids were
 * shown. Consecutive sessions exclude the previous set whenever the bank is
 * large enough, so retries really are renewed instead of repeating the quiz.
 */
export async function createQuizSession(
  userId: string,
  quizId: string,
  limit = 8,
): Promise<QuizSessionPayload | null> {
  const ts = nowIso();
  await run('DELETE FROM quiz_sessions WHERE user_id = ? AND expires_at < ?', userId, ts);

  const pool = await all<{ id: string }>(
    'SELECT id FROM quiz_questions WHERE quiz_id = ? ORDER BY random()',
    quizId,
  );
  if (pool.length === 0) return null;

  const last = await one<{ question_ids: string }>(
    `SELECT question_ids FROM quiz_sessions
     WHERE user_id = ? AND quiz_id = ? ORDER BY created_at DESC LIMIT 1`,
    userId,
    quizId,
  );
  let previousIds: string[] = [];
  if (last) {
    try {
      previousIds = JSON.parse(last.question_ids) as string[];
    } catch {
      previousIds = [];
    }
  }
  const previous = new Set(previousIds);
  const fresh = pool.filter((row) => !previous.has(row.id));
  const candidates = fresh.length >= Math.min(limit, pool.length) ? fresh : pool;
  const selected = candidates.slice(0, limit).map((row) => row.id);
  if (selected.length === 0) return null;

  const id = newId('qss');
  const expiresAt = new Date(Date.now() + QUIZ_SESSION_TTL_MS).toISOString();
  await run(
    `INSERT INTO quiz_sessions (id, user_id, quiz_id, question_ids, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    quizId,
    JSON.stringify(selected),
    ts,
    expiresAt,
  );

  const questions = await listQuizQuestionsByIds(quizId, selected);
  return { id, quizId, questionIds: selected, questions, createdAt: ts, expiresAt };
}

export async function getQuizSessionForUser(
  userId: string,
  sessionId: string,
): Promise<QuizSessionRecord | null> {
  const row = await one<QuizSessionRow>(
    'SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?',
    sessionId,
    userId,
  );
  if (!row) return null;
  if (row.expires_at < nowIso()) {
    await run('DELETE FROM quiz_sessions WHERE id = ?', row.id);
    return null;
  }
  let questionIds: string[] = [];
  try {
    questionIds = JSON.parse(row.question_ids) as string[];
  } catch {
    questionIds = [];
  }
  return {
    id: row.id,
    quizId: row.quiz_id,
    questionIds,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function deleteQuizSession(userId: string, sessionId: string): Promise<void> {
  await run('DELETE FROM quiz_sessions WHERE id = ? AND user_id = ?', sessionId, userId);
}

export async function saveQuizAttempt(input: {
  userId: string;
  quizId: string;
  scorePoints: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
  answers: unknown;
}): Promise<QuizAttempt> {
  const id = newId('qat');
  const ts = nowIso();
  await run(
    `INSERT INTO quiz_attempts
       (id, user_id, quiz_id, score_points, max_points, correct_count, total_questions, answers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.userId,
    input.quizId,
    input.scorePoints,
    input.maxPoints,
    input.correctCount,
    input.totalQuestions,
    JSON.stringify(input.answers),
    ts,
  );
  return {
    id,
    quizId: input.quizId,
    scorePoints: input.scorePoints,
    maxPoints: input.maxPoints,
    correctCount: input.correctCount,
    totalQuestions: input.totalQuestions,
    createdAt: ts,
  };
}

export async function getBestQuizAttempt(
  userId: string,
  quizId: string,
): Promise<QuizAttempt | null> {
  const row = await one<QuizAttemptRow>(
    `SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?
     ORDER BY (score_points * 1.0 / NULLIF(max_points, 0)) DESC, created_at ASC LIMIT 1`,
    userId,
    quizId,
  );
  return row ? toQuizAttempt(row) : null;
}

export async function listQuizBestScores(
  userId: string,
): Promise<Record<string, QuizBestScore>> {
  const rows = await all<{ quiz_id: string; score_points: number; max_points: number }>(
    `SELECT DISTINCT ON (quiz_id) quiz_id, score_points, max_points
     FROM quiz_attempts WHERE user_id = ?
     ORDER BY quiz_id, (score_points * 1.0 / NULLIF(max_points, 0)) DESC, created_at ASC`,
    userId,
  );
  const map: Record<string, QuizBestScore> = {};
  for (const row of rows) {
    map[row.quiz_id] = { scorePoints: row.score_points, maxPoints: row.max_points };
  }
  return map;
}

export async function countQuizAttempts(userId: string): Promise<number> {
  const row = await one<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM quiz_attempts WHERE user_id = ?',
    userId,
  );
  return row?.c ?? 0;
}

/* ------------------------------------------------------------------ */
/* Points ledger                                                       */
/* ------------------------------------------------------------------ */

export async function awardPoints(input: {
  userId: string;
  source: PointsSource;
  sourceId?: string | null;
  points: number;
}): Promise<void> {
  const points = Math.round(input.points);
  if (points <= 0) return;
  await run(
    `INSERT INTO points_ledger (id, user_id, source, source_id, points, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    newId('pts'),
    input.userId,
    input.source,
    input.sourceId ?? null,
    points,
    nowIso(),
  );
}

export async function getPointsTotal(userId: string): Promise<number> {
  const row = await one<{ total: number }>(
    'SELECT COALESCE(SUM(points), 0)::int AS total FROM points_ledger WHERE user_id = ?',
    userId,
  );
  return row?.total ?? 0;
}

export async function getPointsBySource(userId: string): Promise<Record<PointsSource, number>> {
  const rows = await all<{ source: PointsSource; total: number }>(
    'SELECT source, COALESCE(SUM(points), 0)::int AS total FROM points_ledger WHERE user_id = ? GROUP BY source',
    userId,
  );
  const map: Record<PointsSource, number> = { LESSON: 0, QUIZ: 0, STORY: 0, REVIEW: 0 };
  for (const row of rows) map[row.source] = row.total;
  return map;
}

export async function getPointsHistory(userId: string, limit = 10): Promise<PointsEvent[]> {
  const rows = await all<PointsRow>(
    'SELECT id, source, source_id, points, created_at FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    userId,
    limit,
  );
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    points: row.points,
    createdAt: row.created_at,
  }));
}

export async function getActivityDates(userId: string, limit = 120): Promise<string[]> {
  const rows = await all<{ created_at: string }>(
    'SELECT created_at FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    userId,
    limit,
  );
  return rows.map((row) => row.created_at);
}

export async function getPointsSummary(userId: string): Promise<PointsSummary> {
  const [total, bySource, activityDates] = await Promise.all([
    getPointsTotal(userId),
    getPointsBySource(userId),
    getActivityDates(userId),
  ]);
  const level = levelForPoints(total);
  const streak = computeStreak(activityDates);
  return {
    total,
    bySource,
    streak,
    levelKey: level.key,
    levelIndex: level.index,
    levelMin: level.min,
    nextLevelAt: level.next,
  };
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export async function logAudit(input: {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}): Promise<void> {
  await run(
    `INSERT INTO audit_log (id, actor_id, action, entity, entity_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId('aud'),
    input.actorId,
    input.action,
    input.entity,
    input.entityId ?? null,
    input.detail ?? null,
    nowIso(),
  );
}

export type PublicCounts = {
  courses: number;
  lessons: number;
  quizzes: number;
  stories: number;
  vocabulary: number;
};

/** Live content counts for the public landing page — real data only, no marketing numbers. */
export async function getPublicCounts(): Promise<PublicCounts> {
  const row = await one<PublicCounts>(`
    SELECT
      (SELECT COUNT(*)::int FROM courses) AS courses,
      (SELECT COUNT(*)::int FROM lessons) AS lessons,
      (SELECT COUNT(*)::int FROM quizzes) AS quizzes,
      (SELECT COUNT(*)::int FROM stories) AS stories,
      (SELECT COUNT(*)::int FROM vocabulary) AS vocabulary
  `);
  if (!row) throw new Error('public counts unavailable');
  return row;
}
