// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
import { newId, nowIso, run, setQueryExecutor } from './client';
import { SCHEMA_SQL } from './schema';

const pglite = new PGlite();

beforeAll(async () => {
  await pglite.waitReady;
  await pglite.exec(SCHEMA_SQL);
  setQueryExecutor({
    async query(text, params) {
      const result = await pglite.query(text, (params ?? []) as unknown[]);
      return { rows: result.rows, rowCount: result.affectedRows ?? null };
    },
    async exec(sql) {
      await pglite.exec(sql);
    },
  });
}, 60_000);

afterAll(async () => {
  setQueryExecutor(undefined);
  await pglite.close();
});

async function seedCourseWithLesson() {
  const courseId = newId('crs');
  await run(
    `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
     VALUES (?, ?, 'Course', 'desc', 'a1', 'Grammar', '📘', 'brand', 1, 1, ?, ?)`,
    courseId,
    `c-${courseId}`,
    nowIso(),
    nowIso(),
  );
  const lessonId = newId('les');
  await run(
    `INSERT INTO lessons (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, created_at, updated_at)
     VALUES (?, ?, ?, 'Lesson', 'summary', 'body', 'transcript', 10, 1, ?, ?)`,
    lessonId,
    courseId,
    `l-${lessonId}`,
    nowIso(),
    nowIso(),
  );
  return { courseId, lessonId };
}

describe('users', () => {
  it('creates, finds and normalises users', async () => {
    const created = await createUser({ email: 'Sara@Example.com', name: 'Sara', passwordHash: 'hash' });
    expect(created.email).toBe('sara@example.com');
    expect(await countUsers()).toBe(1);

    const found = await findUserById(created.id);
    expect(found?.name).toBe('Sara');
    expect(found?.role).toBe('STUDENT');

    const withSecret = await findUserWithSecret('sara@example.com');
    expect(withSecret?.passwordHash).toBe('hash');
  });

  it('enforces unique emails', async () => {
    await expect(
      createUser({ email: 'sara@example.com', name: 'Dup', passwordHash: 'x' }),
    ).rejects.toThrow();
  });

  it('updates and deletes users', async () => {
    const user = await createUser({ email: 'temp@example.com', name: 'Temp', passwordHash: 'x' });
    await updateUserRole(user.id, 'ADMIN');
    expect((await findUserById(user.id))?.role).toBe('ADMIN');
    await deleteUser(user.id);
    expect(await findUserById(user.id)).toBeNull();
    expect((await listUsers()).length).toBeGreaterThanOrEqual(1);
  });
});

describe('settings', () => {
  it('returns defaults and persists updates', async () => {
    const user = await createUser({ email: 'prefs@example.com', name: 'Prefs', passwordHash: 'x' });
    expect(await getSettings(user.id)).toEqual({
      dailyGoalMinutes: 15,
      theme: 'system',
      uiLanguage: 'ar',
    });
    const next = await updateSettings(user.id, { dailyGoalMinutes: 30, theme: 'dark' });
    expect(next.dailyGoalMinutes).toBe(30);
    expect((await getSettings(user.id)).theme).toBe('dark');
  });
});

describe('lesson progress', () => {
  it('upserts progress and keeps the highest percentage', async () => {
    const user = await createUser({ email: 'learner@example.com', name: 'L', passwordHash: 'x' });
    const { lessonId } = await seedCourseWithLesson();

    await saveLessonProgress({
      userId: user.id,
      lessonId,
      positionSeconds: 30,
      percent: 40,
      status: 'IN_PROGRESS',
    });
    await saveLessonProgress({
      userId: user.id,
      lessonId,
      positionSeconds: 20,
      percent: 10,
      status: 'IN_PROGRESS',
    });
    let progress = await getLessonProgress(user.id, lessonId);
    expect(progress?.percent).toBe(40);

    await saveLessonProgress({
      userId: user.id,
      lessonId,
      positionSeconds: 600,
      percent: 100,
      status: 'COMPLETED',
    });
    progress = await getLessonProgress(user.id, lessonId);
    expect(progress?.status).toBe('COMPLETED');
    expect(progress?.completedAt).not.toBeNull();
  });
});

describe('spaced repetition', () => {
  it('creates due cards and reschedules them', async () => {
    const user = await createUser({ email: 'srs@example.com', name: 'S', passwordHash: 'x' });
    const vocab = await createVocabulary({ term: 'reliable', translation: 'موثوق' });
    await ensureReviewEntries(user.id);

    const due = await listDueCards(user.id);
    expect(due.map((card) => card.vocab.id)).toContain(vocab.id);

    await saveReviewState({
      userId: user.id,
      vocabId: vocab.id,
      ease: 2.5,
      intervalDays: 3,
      repetitions: 1,
      lapses: 0,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect((await listDueCards(user.id)).map((card) => card.vocab.id)).not.toContain(vocab.id);
  });
});

describe('stories', () => {
  it('keeps the best attempt score', async () => {
    const user = await createUser({ email: 'story@example.com', name: 'S', passwordHash: 'x' });
    await run(
      `INSERT INTO stories (id, slug, title, level, body, created_at, updated_at)
       VALUES ('story-1', 'story-one', 'Story', 'a1', 'Once upon a time.', ?, ?)`,
      nowIso(),
      nowIso(),
    );
    await saveStoryAttempt({
      userId: user.id,
      storyId: 'story-1',
      score: 2,
      total: 3,
      answers: [0, 1, 2],
    });
    await saveStoryAttempt({
      userId: user.id,
      storyId: 'story-1',
      score: 3,
      total: 3,
      answers: [1, 1, 2],
    });
    expect(await getBestStoryScore(user.id, 'story-1')).toBe(3);
  });
});
