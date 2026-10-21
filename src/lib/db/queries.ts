import { getDb, newId, nowIso } from './client';
import { computeStreak, levelForPoints } from '../points';
import type {
  Course,
  CourseProgressSummary,
  Lesson,
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
/* Row types (snake_case shapes returned by SQLite)                    */
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

export function countUsers(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  return row.c;
}

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}): PublicUser {
  const id = newId('usr');
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, input.email.toLowerCase(), input.name, input.passwordHash, input.role ?? 'STUDENT', ts, ts);
  return { id, email: input.email.toLowerCase(), name: input.name, role: input.role ?? 'STUDENT' };
}

export function findUserWithSecret(
  email: string,
): { user: PublicUser; passwordHash: string } | null {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined;
  if (!row) return null;
  return { user: toPublicUser(row), passwordHash: row.password_hash };
}

export function findUserById(id: string): User | null {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export function listUsers(): User[] {
  const rows = getDb()
    .prepare('SELECT * FROM users ORDER BY created_at DESC')
    .all() as unknown as UserRow[];
  return rows.map(toUser);
}

export function updateUserRole(userId: string, role: Role): void {
  getDb().prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, nowIso(), userId);
}

export function deleteUser(userId: string): void {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function getSettings(userId: string): UserSettings {
  const row = getDb()
    .prepare('SELECT daily_goal_minutes, theme, ui_language FROM user_settings WHERE user_id = ?')
    .get(userId) as SettingsRow | undefined;
  if (!row) {
    ensureSettings(userId);
    return { dailyGoalMinutes: 15, theme: 'system', uiLanguage: 'ar' };
  }
  return {
    dailyGoalMinutes: row.daily_goal_minutes,
    theme: row.theme,
    uiLanguage: row.ui_language,
  };
}

export function ensureSettings(userId: string): void {
  getDb()
    .prepare(
      `INSERT INTO user_settings (user_id, daily_goal_minutes, theme, ui_language, updated_at)
       VALUES (?, 15, 'system', 'ar', ?)
       ON CONFLICT(user_id) DO NOTHING`,
    )
    .run(userId, nowIso());
}

export function updateSettings(userId: string, patch: Partial<UserSettings>): UserSettings {
  const current = getSettings(userId);
  const next: UserSettings = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE user_settings
       SET daily_goal_minutes = ?, theme = ?, ui_language = ?, updated_at = ?
       WHERE user_id = ?`,
    )
    .run(next.dailyGoalMinutes, next.theme, next.uiLanguage, nowIso(), userId);
  return next;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export function createSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent?: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, user_agent, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId('ses'),
      input.userId,
      input.tokenHash,
      input.userAgent ?? null,
      input.expiresAt,
      nowIso(),
    );
}

export function findSession(tokenHash: string): { userId: string; expiresAt: string } | null {
  const row = getDb()
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .get(tokenHash) as SessionRow | undefined;
  if (!row) return null;
  return { userId: row.user_id, expiresAt: row.expires_at };
}

export function deleteSession(tokenHash: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function deleteExpiredSessions(): void {
  getDb().prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export function listMedia(): Media[] {
  const rows = getDb().prepare('SELECT * FROM media ORDER BY created_at DESC').all() as unknown as MediaRow[];
  return rows.map(toMedia);
}

export function getMediaById(id: string): Media | null {
  const row = getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;
  return row ? toMedia(row) : null;
}

export function updateMediaVerification(
  id: string,
  status: VerificationStatus,
  note: string | null,
): void {
  getDb()
    .prepare(
      `UPDATE media
       SET verification_status = ?, verification_note = ?, last_checked_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(status, note, nowIso(), nowIso(), id);
}

/* ------------------------------------------------------------------ */
/* Courses & lessons                                                   */
/* ------------------------------------------------------------------ */

export function listCourses(includeUnpublished = false): Course[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
       FROM courses c
       ${includeUnpublished ? '' : 'WHERE c.is_published = 1'}
       ORDER BY c.position ASC, c.title ASC`,
    )
    .all() as unknown as CourseRow[];
  return rows.map(toCourse);
}

export function getCourseBySlug(slug: string): Course | null {
  const row = getDb().prepare('SELECT * FROM courses WHERE slug = ?').get(slug) as
    | CourseRow
    | undefined;
  return row ? toCourse(row) : null;
}

export function getCourseById(id: string): Course | null {
  const row = getDb().prepare('SELECT * FROM courses WHERE id = ?').get(id) as CourseRow | undefined;
  return row ? toCourse(row) : null;
}

export function listLessonsByCourse(courseId: string): Lesson[] {
  const rows = getDb()
    .prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY position ASC')
    .all(courseId) as unknown as LessonRow[];
  return rows.map(toLesson);
}

export function getLessonBySlug(courseId: string, slug: string): LessonWithMedia | null {
  const row = getDb()
    .prepare('SELECT * FROM lessons WHERE course_id = ? AND slug = ?')
    .get(courseId, slug) as LessonRow | undefined;
  if (!row) return null;
  const media = row.media_id ? getMediaById(row.media_id) : null;
  return { ...toLesson(row), media };
}

export function getLessonById(id: string): LessonWithMedia | null {
  const row = getDb().prepare('SELECT * FROM lessons WHERE id = ?').get(id) as LessonRow | undefined;
  if (!row) return null;
  const media = row.media_id ? getMediaById(row.media_id) : null;
  return { ...toLesson(row), media };
}

export function countLessonsByCourse(courseId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM lessons WHERE course_id = ?')
    .get(courseId) as { c: number };
  return row.c;
}

/* ------------------------------------------------------------------ */
/* Lesson progress                                                     */
/* ------------------------------------------------------------------ */

export function getLessonProgress(userId: string, lessonId: string): LessonProgress | null {
  const row = getDb()
    .prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?')
    .get(userId, lessonId) as ProgressRow | undefined;
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

export function saveLessonProgress(input: {
  userId: string;
  lessonId: string;
  positionSeconds: number;
  percent: number;
  status: ProgressStatus;
}): LessonProgress {
  const ts = nowIso();
  const completedAt = input.status === 'COMPLETED' ? ts : null;
  getDb()
    .prepare(
      `INSERT INTO lesson_progress
         (id, user_id, lesson_id, status, position_seconds, percent, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         status = excluded.status,
         position_seconds = excluded.position_seconds,
         percent = MAX(lesson_progress.percent, excluded.percent),
         updated_at = excluded.updated_at,
         completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at)`,
    )
    .run(
      newId('prg'),
      input.userId,
      input.lessonId,
      input.status,
      Math.max(0, Math.round(input.positionSeconds)),
      Math.min(100, Math.max(0, Math.round(input.percent))),
      ts,
      completedAt,
    );
  return getLessonProgress(input.userId, input.lessonId)!;
}

export function listCourseProgress(userId: string, courseId: string): Record<string, LessonProgress> {
  const rows = getDb()
    .prepare(
      `SELECT p.* FROM lesson_progress p
       JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = ? AND l.course_id = ?`,
    )
    .all(userId, courseId) as unknown as ProgressRow[];
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

export function getCourseProgressSummaries(userId: string): CourseProgressSummary[] {
  const courses = listCourses();
  return courses.map((course) => {
    const row = getDb()
      .prepare(
        `SELECT
           COUNT(l.id) AS total,
           SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
         FROM lessons l
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
         WHERE l.course_id = ?`,
      )
      .get(userId, course.id) as { total: number; completed: number | null };
    const total = row.total ?? 0;
    const completed = row.completed ?? 0;
    return {
      course,
      totalLessons: total,
      completedLessons: completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}

export interface LearningStats {
  lessonsCompleted: number;
  lessonsInProgress: number;
  minutesLearned: number;
  coursesStarted: number;
  vocabularyTracked: number;
  reviewsDue: number;
}

export function getLearningStats(userId: string): LearningStats {
  const db = getDb();
  const completed = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(l.duration_minutes), 0) AS m
       FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = ? AND p.status = 'COMPLETED'`,
    )
    .get(userId) as { c: number; m: number };
  const inProgress = db
    .prepare(
      `SELECT COUNT(*) AS c FROM lesson_progress WHERE user_id = ? AND status = 'IN_PROGRESS'`,
    )
    .get(userId) as { c: number };
  const started = db
    .prepare(
      `SELECT COUNT(DISTINCT l.course_id) AS c
       FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = ?`,
    )
    .get(userId) as { c: number };
  const vocab = db
    .prepare('SELECT COUNT(*) AS c FROM vocab_review WHERE user_id = ?')
    .get(userId) as { c: number };
  const due = db
    .prepare('SELECT COUNT(*) AS c FROM vocab_review WHERE user_id = ? AND due_at <= ?')
    .get(userId, nowIso()) as { c: number };

  return {
    lessonsCompleted: completed.c,
    lessonsInProgress: inProgress.c,
    minutesLearned: completed.m ?? 0,
    coursesStarted: started.c,
    vocabularyTracked: vocab.c,
    reviewsDue: due.c,
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
export function listVocabulary(options: VocabularyQuery = {}): Vocabulary[] {
  const db = getDb();
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
  const rows = db.prepare(sql).all(...params) as unknown as VocabularyRow[];
  return rows.map(toVocabulary);
}

/** Number of words in the shared bank (the whole bank, before any sampling). */
export function countVocabulary(courseId?: string): number {
  const row = (
    courseId
      ? getDb()
          .prepare('SELECT COUNT(*) AS c FROM vocabulary WHERE created_by IS NULL AND course_id = ?')
          .get(courseId)
      : getDb().prepare('SELECT COUNT(*) AS c FROM vocabulary WHERE created_by IS NULL').get()
  ) as { c: number };
  return row.c;
}

/** Words created by a single learner ("my saved words"). */
export function listUserVocabulary(userId: string): Vocabulary[] {
  const rows = getDb()
    .prepare('SELECT * FROM vocabulary WHERE created_by = ? ORDER BY created_at DESC')
    .all(userId) as unknown as VocabularyRow[];
  return rows.map(toVocabulary);
}

export function countUserVocabulary(userId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM vocabulary WHERE created_by = ?')
    .get(userId) as { c: number };
  return row.c;
}

export function getVocabularyById(id: string): Vocabulary | null {
  const row = getDb().prepare('SELECT * FROM vocabulary WHERE id = ?').get(id) as
    | VocabularyRow
    | undefined;
  return row ? toVocabulary(row) : null;
}

export function createVocabulary(input: {
  courseId?: string | null;
  lessonId?: string | null;
  term: string;
  translation: string;
  partOfSpeech?: string;
  phonetic?: string | null;
  example?: string;
  createdBy?: string | null;
}): Vocabulary {
  const id = newId('voc');
  getDb()
    .prepare(
      `INSERT INTO vocabulary (id, course_id, lesson_id, term, translation, part_of_speech, phonetic, example, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
  return getVocabularyById(id)!;
}

/** Vocabulary attached to a single lesson (via the shared word bank). */
export function listLessonVocabulary(lessonId: string): Vocabulary[] {
  const rows = getDb()
    .prepare(
      `SELECT v.* FROM vocabulary v
       JOIN lesson_vocabulary lv ON lv.vocab_id = v.id
       WHERE lv.lesson_id = ?
       ORDER BY lv.position ASC, v.term ASC`,
    )
    .all(lessonId) as unknown as VocabularyRow[];
  return rows.map(toVocabulary);
}

/* ------------------------------------------------------------------ */
/* Favorites                                                           */
/* ------------------------------------------------------------------ */

export function addFavorite(userId: string, vocabId: string): void {
  getDb()
    .prepare(
      `INSERT INTO vocab_favorites (id, user_id, vocab_id, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, vocab_id) DO NOTHING`,
    )
    .run(newId('fav'), userId, vocabId, nowIso());
}

export function removeFavorite(userId: string, vocabId: string): void {
  getDb()
    .prepare('DELETE FROM vocab_favorites WHERE user_id = ? AND vocab_id = ?')
    .run(userId, vocabId);
}

export function isFavorite(userId: string, vocabId: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 AS ok FROM vocab_favorites WHERE user_id = ? AND vocab_id = ?')
    .get(userId, vocabId) as { ok: number } | undefined;
  return Boolean(row);
}

/**
 * A learner's favorites list: words they bookmarked from the shared bank plus
 * every word they created themselves.
 */
export function listFavoriteVocabulary(userId: string): Vocabulary[] {
  const rows = getDb()
    .prepare(
      `SELECT v.* FROM vocabulary v
       LEFT JOIN vocab_favorites f ON f.vocab_id = v.id AND f.user_id = ?
       WHERE f.id IS NOT NULL OR v.created_by = ?
       ORDER BY v.term`,
    )
    .all(userId, userId) as unknown as VocabularyRow[];
  return rows.map(toVocabulary);
}

export function countFavorites(userId: string): number {
  const row = getDb()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM vocab_favorites WHERE user_id = ?) +
         (SELECT COUNT(*) FROM vocabulary WHERE created_by = ?) AS c`,
    )
    .get(userId, userId) as { c: number };
  return row.c;
}

export function listFavoriteIds(userId: string): string[] {
  const rows = getDb()
    .prepare('SELECT vocab_id FROM vocab_favorites WHERE user_id = ?')
    .all(userId) as unknown as { vocab_id: string }[];
  return rows.map((row) => row.vocab_id);
}

/* ------------------------------------------------------------------ */
/* Spaced repetition tracking                                          */
/* ------------------------------------------------------------------ */

/** Creates review rows for shared words plus the learner's own words. */
export function ensureReviewEntries(userId: string): void {
  const db = getDb();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO vocab_review (id, user_id, vocab_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at)
     SELECT 'rev_' || lower(hex(randomblob(10))), ?, v.id, 2.5, 0, 0, 0, ?, NULL
     FROM vocabulary v
     WHERE (v.created_by IS NULL OR v.created_by = ?)
       AND NOT EXISTS (
         SELECT 1 FROM vocab_review r WHERE r.user_id = ? AND r.vocab_id = v.id
       )`,
  ).run(userId, ts, userId, userId);
}

export function listDueCards(userId: string, limit = 20): ReviewCard[] {
  ensureReviewEntries(userId);
  const rows = getDb()
    .prepare(
      `SELECT v.*, r.ease, r.interval_days, r.repetitions, r.lapses, r.due_at, r.last_reviewed_at
       FROM vocab_review r JOIN vocabulary v ON v.id = r.vocab_id
       WHERE r.user_id = ? AND r.due_at <= ?
       ORDER BY r.due_at ASC
       LIMIT ?`,
    )
    .all(userId, nowIso(), limit) as unknown as ReviewRow[];
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

export function getReviewCard(userId: string, vocabId: string): ReviewCard | null {
  const row = getDb()
    .prepare(
      `SELECT v.*, r.ease, r.interval_days, r.repetitions, r.lapses, r.due_at, r.last_reviewed_at
       FROM vocab_review r JOIN vocabulary v ON v.id = r.vocab_id
       WHERE r.user_id = ? AND r.vocab_id = ?`,
    )
    .get(userId, vocabId) as ReviewRow | undefined;
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

export function saveReviewState(input: {
  userId: string;
  vocabId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
}): void {
  getDb()
    .prepare(
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
    )
    .run(
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

export function countDueReviews(userId: string): number {
  ensureReviewEntries(userId);
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM vocab_review WHERE user_id = ? AND due_at <= ?')
    .get(userId, nowIso()) as { c: number };
  return row.c;
}

/* ------------------------------------------------------------------ */
/* Stories & quizzes                                                   */
/* ------------------------------------------------------------------ */

export function listStories(): Story[] {
  const rows = getDb()
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM story_questions q WHERE q.story_id = s.id) AS question_count
       FROM stories s WHERE s.is_published = 1 ORDER BY s.position ASC, s.title ASC`,
    )
    .all() as unknown as StoryRow[];
  return rows.map(toStory);
}

export function getStoryBySlug(slug: string): Story | null {
  const row = getDb().prepare('SELECT * FROM stories WHERE slug = ?').get(slug) as
    | StoryRow
    | undefined;
  return row ? toStory(row) : null;
}

export function listStoryQuestions(storyId: string): StoryQuestion[] {
  const rows = getDb()
    .prepare('SELECT * FROM story_questions WHERE story_id = ? ORDER BY position ASC')
    .all(storyId) as unknown as StoryQuestionRow[];
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

export function saveStoryAttempt(input: {
  userId: string;
  storyId: string;
  score: number;
  total: number;
  answers: number[];
}): void {
  getDb()
    .prepare(
      `INSERT INTO story_attempts (id, user_id, story_id, score, total, answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId('att'),
      input.userId,
      input.storyId,
      input.score,
      input.total,
      JSON.stringify(input.answers),
      nowIso(),
    );
}

export function getBestStoryScore(userId: string, storyId: string): number | null {
  const row = getDb()
    .prepare('SELECT MAX(score) AS best FROM story_attempts WHERE user_id = ? AND story_id = ?')
    .get(userId, storyId) as { best: number | null };
  return row.best;
}

/* ------------------------------------------------------------------ */
/* Quizzes & exercises                                                 */
/* ------------------------------------------------------------------ */

const QUIZ_COUNT_COLUMNS = `(SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
       (SELECT COALESCE(SUM(qq.points), 0) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS total_points`;

export function listQuizzes(): Quiz[] {
  const rows = getDb()
    .prepare(
      `SELECT q.*, ${QUIZ_COUNT_COLUMNS}
       FROM quizzes q
       WHERE q.is_published = 1
       ORDER BY q.position ASC, q.title ASC`,
    )
    .all() as unknown as QuizRow[];
  return rows.map(toQuiz);
}

export function getQuizBySlug(slug: string): Quiz | null {
  const row = getDb()
    .prepare(`SELECT q.*, ${QUIZ_COUNT_COLUMNS} FROM quizzes q WHERE q.slug = ?`)
    .get(slug) as QuizRow | undefined;
  return row ? toQuiz(row) : null;
}

export function getQuizById(id: string): Quiz | null {
  const row = getDb()
    .prepare(`SELECT q.*, ${QUIZ_COUNT_COLUMNS} FROM quizzes q WHERE q.id = ?`)
    .get(id) as QuizRow | undefined;
  return row ? toQuiz(row) : null;
}

export function getQuizByLessonId(lessonId: string): Quiz | null {
  const row = getDb()
    .prepare(
      `SELECT q.*, ${QUIZ_COUNT_COLUMNS}
       FROM quizzes q WHERE q.lesson_id = ? AND q.is_published = 1
       ORDER BY q.position ASC LIMIT 1`,
    )
    .get(lessonId) as QuizRow | undefined;
  return row ? toQuiz(row) : null;
}

export function listQuizQuestions(quizId: string): QuizQuestion[] {
  const rows = getDb()
    .prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC')
    .all(quizId) as unknown as QuizQuestionRow[];
  return rows.map(toQuizQuestion);
}

export function saveQuizAttempt(input: {
  userId: string;
  quizId: string;
  scorePoints: number;
  maxPoints: number;
  correctCount: number;
  totalQuestions: number;
  answers: unknown;
}): QuizAttempt {
  const id = newId('qat');
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO quiz_attempts
         (id, user_id, quiz_id, score_points, max_points, correct_count, total_questions, answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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

export function getBestQuizAttempt(userId: string, quizId: string): QuizAttempt | null {
  const row = getDb()
    .prepare(
      `SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?
       ORDER BY score_points DESC, created_at ASC LIMIT 1`,
    )
    .get(userId, quizId) as QuizAttemptRow | undefined;
  return row ? toQuizAttempt(row) : null;
}

export function listQuizBestScores(userId: string): Record<string, QuizBestScore> {
  const rows = getDb()
    .prepare(
      `SELECT quiz_id, MAX(score_points) AS best, MAX(max_points) AS maxp
       FROM quiz_attempts WHERE user_id = ? GROUP BY quiz_id`,
    )
    .all(userId) as unknown as { quiz_id: string; best: number; maxp: number }[];
  const map: Record<string, QuizBestScore> = {};
  for (const row of rows) {
    map[row.quiz_id] = { scorePoints: row.best, maxPoints: row.maxp };
  }
  return map;
}

export function countQuizAttempts(userId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM quiz_attempts WHERE user_id = ?')
    .get(userId) as { c: number };
  return row.c;
}

/* ------------------------------------------------------------------ */
/* Points ledger                                                       */
/* ------------------------------------------------------------------ */

export function awardPoints(input: {
  userId: string;
  source: PointsSource;
  sourceId?: string | null;
  points: number;
}): void {
  const points = Math.round(input.points);
  if (points <= 0) return;
  getDb()
    .prepare(
      `INSERT INTO points_ledger (id, user_id, source, source_id, points, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(newId('pts'), input.userId, input.source, input.sourceId ?? null, points, nowIso());
}

export function getPointsTotal(userId: string): number {
  const row = getDb()
    .prepare('SELECT COALESCE(SUM(points), 0) AS total FROM points_ledger WHERE user_id = ?')
    .get(userId) as { total: number };
  return row.total ?? 0;
}

export function getPointsBySource(userId: string): Record<PointsSource, number> {
  const rows = getDb()
    .prepare('SELECT source, COALESCE(SUM(points), 0) AS total FROM points_ledger WHERE user_id = ? GROUP BY source')
    .all(userId) as unknown as { source: PointsSource; total: number }[];
  const map: Record<PointsSource, number> = { LESSON: 0, QUIZ: 0, STORY: 0, REVIEW: 0 };
  for (const row of rows) map[row.source] = row.total;
  return map;
}

export function getPointsHistory(userId: string, limit = 10): PointsEvent[] {
  const rows = getDb()
    .prepare(
      'SELECT id, source, source_id, points, created_at FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    )
    .all(userId, limit) as unknown as PointsRow[];
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    points: row.points,
    createdAt: row.created_at,
  }));
}

export function getActivityDates(userId: string, limit = 120): string[] {
  const rows = getDb()
    .prepare(
      'SELECT created_at FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    )
    .all(userId, limit) as unknown as { created_at: string }[];
  return rows.map((row) => row.created_at);
}

export function getPointsSummary(userId: string): PointsSummary {
  const total = getPointsTotal(userId);
  const level = levelForPoints(total);
  const streak = computeStreak(getActivityDates(userId));
  return {
    total,
    bySource: getPointsBySource(userId),
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

export function logAudit(input: {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO audit_log (id, actor_id, action, entity, entity_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId('aud'),
      input.actorId,
      input.action,
      input.entity,
      input.entityId ?? null,
      input.detail ?? null,
      nowIso(),
    );
}
