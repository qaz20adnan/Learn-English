// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

import {
  countUsers,
  createUser,
  createVocabulary,
  deleteUser,
  ensureReviewEntries,
  findUserById,
  findUserWithSecret,
  getBestStoryScore,
  getLessonProgress,
  getSettings,
  listDueCards,
  listUsers,
  saveLessonProgress,
  saveReviewState,
  saveStoryAttempt,
  updateSettings,
  updateUserRole,
} from './queries';
import { getDb, newId, nowIso } from './client';

function seedCourseWithLesson() {
  const db = getDb();
  const courseId = newId('crs');
  db.prepare(
    `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
     VALUES (?, ?, 'Course', 'desc', 'a1', 'Grammar', '📘', 'brand', 1, 1, ?, ?)`,
  ).run(courseId, `c-${courseId}`, nowIso(), nowIso());
  const lessonId = newId('les');
  db.prepare(
    `INSERT INTO lessons (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, created_at, updated_at)
     VALUES (?, ?, ?, 'Lesson', 'summary', 'body', 'transcript', 10, 1, ?, ?)`,
  ).run(lessonId, courseId, `l-${lessonId}`, nowIso(), nowIso());
  return { courseId, lessonId };
}

describe('users', () => {
  beforeAll(() => {
    getDb();
  });

  it('creates, finds and normalises users', () => {
    const created = createUser({ email: 'Sara@Example.com', name: 'Sara', passwordHash: 'hash' });
    expect(created.email).toBe('sara@example.com');
    expect(countUsers()).toBe(1);

    const found = findUserById(created.id);
    expect(found?.name).toBe('Sara');
    expect(found?.role).toBe('STUDENT');

    const withSecret = findUserWithSecret('sara@example.com');
    expect(withSecret?.passwordHash).toBe('hash');
  });

  it('enforces unique emails', () => {
    expect(() =>
      createUser({ email: 'sara@example.com', name: 'Dup', passwordHash: 'x' }),
    ).toThrow();
  });

  it('updates and deletes users', () => {
    const user = createUser({ email: 'temp@example.com', name: 'Temp', passwordHash: 'x' });
    updateUserRole(user.id, 'ADMIN');
    expect(findUserById(user.id)?.role).toBe('ADMIN');
    deleteUser(user.id);
    expect(findUserById(user.id)).toBeNull();
    expect(listUsers().length).toBeGreaterThanOrEqual(1);
  });
});

describe('settings', () => {
  it('returns defaults and persists updates', () => {
    const user = createUser({ email: 'prefs@example.com', name: 'Prefs', passwordHash: 'x' });
    expect(getSettings(user.id)).toEqual({ dailyGoalMinutes: 15, theme: 'system', uiLanguage: 'ar' });
    const next = updateSettings(user.id, { dailyGoalMinutes: 30, theme: 'dark' });
    expect(next.dailyGoalMinutes).toBe(30);
    expect(getSettings(user.id).theme).toBe('dark');
  });
});

describe('lesson progress', () => {
  it('upserts progress and keeps the highest percentage', () => {
    const user = createUser({ email: 'learner@example.com', name: 'L', passwordHash: 'x' });
    const { lessonId } = seedCourseWithLesson();

    saveLessonProgress({ userId: user.id, lessonId, positionSeconds: 30, percent: 40, status: 'IN_PROGRESS' });
    saveLessonProgress({ userId: user.id, lessonId, positionSeconds: 20, percent: 10, status: 'IN_PROGRESS' });
    let progress = getLessonProgress(user.id, lessonId);
    expect(progress?.percent).toBe(40);

    saveLessonProgress({ userId: user.id, lessonId, positionSeconds: 600, percent: 100, status: 'COMPLETED' });
    progress = getLessonProgress(user.id, lessonId);
    expect(progress?.status).toBe('COMPLETED');
    expect(progress?.completedAt).not.toBeNull();
  });
});

describe('spaced repetition', () => {
  it('creates due cards and reschedules them', () => {
    const user = createUser({ email: 'srs@example.com', name: 'S', passwordHash: 'x' });
    const vocab = createVocabulary({ term: 'reliable', translation: 'موثوق' });
    ensureReviewEntries(user.id);

    const due = listDueCards(user.id);
    expect(due.map((card) => card.vocab.id)).toContain(vocab.id);

    saveReviewState({
      userId: user.id,
      vocabId: vocab.id,
      ease: 2.5,
      intervalDays: 3,
      repetitions: 1,
      lapses: 0,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(listDueCards(user.id).map((card) => card.vocab.id)).not.toContain(vocab.id);
  });
});

describe('stories', () => {
  it('keeps the best attempt score', () => {
    const user = createUser({ email: 'story@example.com', name: 'S', passwordHash: 'x' });
    getDb()
      .prepare(
        `INSERT INTO stories (id, slug, title, level, body, created_at, updated_at)
         VALUES ('story-1', 'story-one', 'Story', 'a1', 'Once upon a time.', ?, ?)`,
      )
      .run(nowIso(), nowIso());
    saveStoryAttempt({ userId: user.id, storyId: 'story-1', score: 2, total: 3, answers: [0, 1, 2] });
    saveStoryAttempt({ userId: user.id, storyId: 'story-1', score: 3, total: 3, answers: [1, 1, 2] });
    expect(getBestStoryScore(user.id, 'story-1')).toBe(3);
  });
});
