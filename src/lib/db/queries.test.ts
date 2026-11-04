// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  addFavorite,
  awardPoints,
  countFavorites,
  countUsers,
  createQuizSession,
  createUser,
  createVocabulary,
  deleteQuizSession,
  deleteUser,
  ensureReviewEntries,
  findUserById,
  findUserWithSecret,
  getBestStoryScore,
  getContinueLearning,
  getCourseProgressSummaries,
  getCourseUnits,
  getDailyProgress,
  getLearningStats,
  getLessonAssessment,
  getLessonProgress,
  getLearnerMilestones,
  getNextRecommendedCourse,
  getQuizSessionForUser,
  listCourseAssessments,
  getPointsTotal,
  getRoadmapData,
  getReviewCard,
  getSettings,
  getVocabularyForUser,
  listCourseProgress,
  listDueCards,
  listFavoriteIds,
  listFavoriteVocabulary,
  listPracticeWords,
  listRecentLessons,
  listUsers,
  listVocabulary,
  listVocabularyPaged,
  listVocabularyPartsOfSpeech,
  saveLessonProgress,
  saveQuizAttempt,
  saveReviewState,
  saveStoryAttempt,
  updateSettings,
  updateUserRole,
} from './queries';
import { newId, nowIso, one, run, setQueryExecutor } from './client';
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

describe('account isolation', () => {
  it('keeps lesson progress and settings per learner', async () => {
    const first = await createUser({
      email: 'isolation-progress-a@example.com',
      name: 'First',
      passwordHash: 'x',
    });
    const second = await createUser({
      email: 'isolation-progress-b@example.com',
      name: 'Second',
      passwordHash: 'x',
    });
    const { courseId, lessonId } = await seedCourseWithLesson();

    await saveLessonProgress({
      userId: first.id,
      lessonId,
      positionSeconds: 600,
      percent: 100,
      status: 'COMPLETED',
    });
    await updateSettings(first.id, { dailyGoalMinutes: 45, theme: 'dark' });

    expect((await getLessonProgress(first.id, lessonId))?.status).toBe('COMPLETED');
    expect(await getLessonProgress(second.id, lessonId)).toBeNull();
    expect(await listCourseProgress(second.id, courseId)).toEqual({});
    expect((await getLearningStats(second.id)).lessonsCompleted).toBe(0);
    expect((await getLearningStats(second.id)).coursesStarted).toBe(0);

    const secondCourse = (await getCourseProgressSummaries(second.id)).find(
      (summary) => summary.course.id === courseId,
    );
    expect(secondCourse?.completedLessons).toBe(0);
    expect((await getSettings(second.id)).dailyGoalMinutes).toBe(15);
    expect((await getSettings(first.id)).dailyGoalMinutes).toBe(45);
  });

  it("does not expose another learner's private words through favorites", async () => {
    const owner = await createUser({
      email: 'isolation-favorites-a@example.com',
      name: 'Owner',
      passwordHash: 'x',
    });
    const other = await createUser({
      email: 'isolation-favorites-b@example.com',
      name: 'Other',
      passwordHash: 'x',
    });
    const privateWord = await createVocabulary({
      term: 'isolation-private-word',
      translation: 'خاص',
      createdBy: owner.id,
    });
    const sharedWord = await createVocabulary({
      term: 'isolation-shared-word',
      translation: 'مشترك',
    });

    expect(await getVocabularyForUser(owner.id, privateWord.id)).not.toBeNull();
    expect(await getVocabularyForUser(other.id, privateWord.id)).toBeNull();
    expect(await getVocabularyForUser(other.id, sharedWord.id)).not.toBeNull();

    await addFavorite(other.id, sharedWord.id);
    // Simulate a legacy row or a bug that bypassed the API ownership check.
    await run(
      'INSERT INTO vocab_favorites (id, user_id, vocab_id, created_at) VALUES (?, ?, ?, ?)',
      newId('fav'),
      other.id,
      privateWord.id,
      nowIso(),
    );

    const visible = await listFavoriteVocabulary(other.id);
    expect(visible.map((word) => word.id)).toContain(sharedWord.id);
    expect(visible.map((word) => word.id)).not.toContain(privateWord.id);
    expect(await countFavorites(other.id)).toBe(1);
    expect(await listFavoriteIds(other.id)).toEqual([sharedWord.id]);
  });

  it('keeps review schedules and points per learner', async () => {
    const first = await createUser({
      email: 'isolation-review-a@example.com',
      name: 'First',
      passwordHash: 'x',
    });
    const second = await createUser({
      email: 'isolation-review-b@example.com',
      name: 'Second',
      passwordHash: 'x',
    });
    const word = await createVocabulary({
      term: 'isolation-review-word',
      translation: 'مراجعة',
    });
    await ensureReviewEntries(first.id);
    await ensureReviewEntries(second.id);

    await saveReviewState({
      userId: first.id,
      vocabId: word.id,
      ease: 2.6,
      intervalDays: 30,
      repetitions: 1,
      lapses: 0,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect((await getReviewCard(first.id, word.id))?.intervalDays).toBe(30);
    expect((await listDueCards(first.id, 100)).map((card) => card.vocab.id)).not.toContain(
      word.id,
    );

    const secondCard = await getReviewCard(second.id, word.id);
    expect(secondCard?.intervalDays).toBe(0);
    expect(secondCard?.repetitions).toBe(0);
    expect((await listDueCards(second.id, 100)).map((card) => card.vocab.id)).toContain(word.id);

    await awardPoints({ userId: first.id, source: 'REVIEW', points: 20 });
    expect(await getPointsTotal(first.id)).toBe(20);
    expect(await getPointsTotal(second.id)).toBe(0);
  });
});

describe('lesson assessments and quiz sessions', () => {
  async function seedQuiz(lessonId: string, courseId: string, passPercent = 70) {
    const quizId = newId('qiz');
    await run(
      `INSERT INTO quizzes
         (id, slug, title, description, level, course_id, lesson_id, is_published, position, pass_percent, created_at, updated_at)
       VALUES (?, ?, 'Quiz', 'desc', 'a1', ?, ?, 1, 1, ?, ?, ?)`,
      quizId,
      `q-${quizId}`,
      courseId,
      lessonId,
      passPercent,
      nowIso(),
      nowIso(),
    );
    for (let index = 0; index < 6; index += 1) {
      await run(
        `INSERT INTO quiz_questions
           (id, quiz_id, type, prompt, options, answer_index, accepted_answers, correct_boolean, points, explanation, position)
         VALUES (?, ?, 'MULTIPLE_CHOICE', ?, '["a","b","c","d"]', 0, '[]', NULL, 1, 'why', ?)`,
        newId('qq'),
        quizId,
        `Question ${index}`,
        index,
      );
    }
    return quizId;
  }

  it('uses the best percentage and pass mark to unlock a lesson', async () => {
    const user = await createUser({
      email: 'assessment@example.com',
      name: 'Assessment',
      passwordHash: 'x',
    });
    const { courseId, lessonId } = await seedCourseWithLesson();
    const quizId = await seedQuiz(lessonId, courseId, 70);

    let assessment = await getLessonAssessment(user.id, lessonId);
    expect(assessment).toMatchObject({
      quizId,
      required: true,
      passed: false,
      bestPercent: null,
      attempts: 0,
    });

    await saveQuizAttempt({
      userId: user.id,
      quizId,
      scorePoints: 3,
      maxPoints: 6,
      correctCount: 3,
      totalQuestions: 6,
      answers: [],
    });
    assessment = await getLessonAssessment(user.id, lessonId);
    expect(assessment.bestPercent).toBe(50);
    expect(assessment.passed).toBe(false);

    await saveQuizAttempt({
      userId: user.id,
      quizId,
      scorePoints: 5,
      maxPoints: 6,
      correctCount: 5,
      totalQuestions: 6,
      answers: [],
    });
    assessment = await getLessonAssessment(user.id, lessonId);
    expect(assessment.bestPercent).toBe(83);
    expect(assessment.passed).toBe(true);
    expect(assessment.attempts).toBe(2);

    const batch = await listCourseAssessments(user.id, courseId);
    expect(batch[lessonId]).toMatchObject({ required: true, passed: true, bestPercent: 83 });
  });

  it('creates scoped random sessions that renew question ids', async () => {
    const user = await createUser({
      email: 'sessions@example.com',
      name: 'Session',
      passwordHash: 'x',
    });
    const other = await createUser({
      email: 'sessions-other@example.com',
      name: 'Other',
      passwordHash: 'x',
    });
    const { courseId, lessonId } = await seedCourseWithLesson();
    const quizId = await seedQuiz(lessonId, courseId);

    const first = await createQuizSession(user.id, quizId, 3);
    const second = await createQuizSession(user.id, quizId, 3);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.questions).toHaveLength(3);
    expect(second?.questions).toHaveLength(3);
    expect(second?.questionIds.some((id) => first?.questionIds.includes(id))).toBe(false);

    const stored = await getQuizSessionForUser(user.id, first!.id);
    expect(stored?.quizId).toBe(quizId);
    expect(stored?.questionIds).toEqual(first!.questionIds);
    expect(await getQuizSessionForUser(other.id, first!.id)).toBeNull();

    await deleteQuizSession(user.id, first!.id);
    expect(await getQuizSessionForUser(user.id, first!.id)).toBeNull();
  });
});

describe('vocabulary library — search, filters & practice (Sprint 2)', () => {
  it('searches, filters, paginates and samples the shared word bank', async () => {
    const a1Course = newId('crs');
    const b1Unpublished = newId('crs');
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'A1 Vocab Course', 'd', 'a1', 'General', '📘', 'brand', 1, 1, ?, ?)`,
      a1Course,
      `a1-${a1Course}`,
      nowIso(),
      nowIso(),
    );
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'B1 Draft Course', 'd', 'b1', 'General', '📘', 'brand', 0, 2, ?, ?)`,
      b1Unpublished,
      `b1-${b1Unpublished}`,
      nowIso(),
      nowIso(),
    );

    await createVocabulary({ courseId: a1Course, term: 'library-apple', translation: 'تفاحة', partOfSpeech: 'noun', example: 'I eat an apple.' });
    await createVocabulary({ courseId: a1Course, term: 'library-arrive', translation: 'يصل متأخراً', partOfSpeech: 'verb' });
    await createVocabulary({ courseId: b1Unpublished, term: 'library-zebra', translation: 'حصان وحشي' });
    await createVocabulary({ term: 'library-banana', translation: 'موز أصفر', partOfSpeech: 'noun' });

    // Plain listing: shared bank only (published courses + unowned words).
    const all = await listVocabularyPaged({ pageSize: 100 });
    const allTerms = all.items.map((word) => word.term);
    expect(allTerms).toContain('library-apple');
    expect(allTerms).toContain('library-banana');
    expect(allTerms).not.toContain('library-zebra'); // draft course stays hidden

    // Deterministic alphabetical order.
    const sorted = [...allTerms].sort((a, b) => a.localeCompare(b));
    expect(allTerms).toEqual(sorted);

    // Free-text search across term, translation and example.
    expect((await listVocabularyPaged({ q: 'LIBRARY-APPLE' })).items.map((w) => w.term)).toEqual(['library-apple']);
    expect((await listVocabularyPaged({ q: 'يصل متأخراً' })).items.map((w) => w.term)).toEqual(['library-arrive']);
    expect((await listVocabularyPaged({ q: 'eat an apple' })).items.map((w) => w.term)).toEqual(['library-apple']);

    // Level filter follows the owning course.
    const a1Words = await listVocabularyPaged({ level: 'a1', pageSize: 100 });
    expect(a1Words.items.map((w) => w.term).sort()).toEqual(['library-apple', 'library-arrive']);

    // Part-of-speech filter.
    expect((await listVocabularyPaged({ pos: 'verb', pageSize: 100 })).items.map((w) => w.term))
      .toContain('library-arrive');

    // Pagination.
    const page1 = await listVocabularyPaged({ q: 'library-', pageSize: 2, page: 1 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBeGreaterThanOrEqual(3);
    expect(page1.totalPages).toBeGreaterThanOrEqual(2);
    const page2 = await listVocabularyPaged({ q: 'library-', pageSize: 2, page: 2 });
    expect(page2.items).toHaveLength(1);
    expect(page1.items.map((w) => w.id)).not.toEqual(page2.items.map((w) => w.id));

    // T1 regression — the random sampler (listVocabulary) must apply the same
    // visibility rule as the paged search: words linked to a draft course stay
    // hidden, so everything displayed is also findable via search.
    const sampled = await listVocabulary({ limit: 100 }).then((rows) => rows.map((w) => w.term));
    expect(sampled).toContain('library-banana');
    expect(sampled).not.toContain('library-zebra');

    // Practice sampler respects the same filters and the limit.
    const practice = await listPracticeWords({ level: 'a1' }, 1);
    expect(practice).toHaveLength(1);
    expect(['library-apple', 'library-arrive']).toContain(practice[0]!.term);
    const practiceAll = await listPracticeWords({ level: 'a1' }, 10);
    expect(practiceAll.length).toBe(2);

    // Distinct parts of speech for the filter dropdown.
    const parts = await listVocabularyPartsOfSpeech();
    expect(parts).toContain('noun');
    expect(parts).toContain('verb');
  });
});

describe('learning roadmap (Sprint 3)', () => {
  async function seedRoadmapCourse(level: string, position: number, lessonCount: number) {
    const courseId = newId('crs');
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'Roadmap Course', 'd', ?, 'General', '📘', 'brand', 1, ?, ?, ?)`,
      courseId,
      `rm-${courseId}`,
      level,
      position,
      nowIso(),
      nowIso(),
    );
    const lessonIds: string[] = [];
    const lessonSlugs: string[] = [];
    for (let i = 0; i < lessonCount; i += 1) {
      const lessonId = newId('les');
      const slug = `rm-${lessonId}-${i}`;
      await run(
        `INSERT INTO lessons (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, created_at, updated_at)
         VALUES (?, ?, ?, 'Roadmap Lesson', 's', 'b', 't', 5, ?, ?, ?)`,
        lessonId,
        courseId,
        slug,
        i + 1,
        nowIso(),
        nowIso(),
      );
      lessonIds.push(lessonId);
      lessonSlugs.push(slug);
    }
    return { courseId, lessonIds, lessonSlugs };
  }

  async function seedUser() {
    return createUser({
      email: `rm-${newId('u')}@test.dev`,
      name: 'Roadmap Learner',
      passwordHash: 'hash',
    });
  }

  it('points a fresh learner at the first path lesson and folds foundation into A1', async () => {
    const user = await seedUser();
    const foundation = await seedRoadmapCourse('foundation', 0, 1);
    const data = await getRoadmapData(user.id);
    expect(data.nextLesson).not.toBeNull();
    expect(data.nextLesson?.lessonSlug).toBe(foundation.lessonSlugs[0]);
    expect(data.nextLesson?.step).toBe('a1');
    expect(data.nextLesson?.courseSlug).toBe(`rm-${foundation.courseId}`);
  });

  it('advances to the next uncompleted lesson once the first is completed', async () => {
    const user = await seedUser();
    const foundation = await seedRoadmapCourse('foundation', 0, 1);
    await saveLessonProgress({
      userId: user.id,
      lessonId: foundation.lessonIds[0],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });
    const data = await getRoadmapData(user.id);
    expect(data.nextLesson).not.toBeNull();
    expect(data.nextLesson?.lessonSlug).not.toBe(foundation.lessonSlugs[0]);
    // Untouched published A1 lessons are the next thing on the path.
    expect(data.nextLesson?.step).toBe('a1');
  });

  it('aggregates per-level course, lesson and completion counts', async () => {
    const user = await seedUser();
    const a2 = await seedRoadmapCourse('a2', 0, 2);
    const before = await getRoadmapData(user.id);
    const a2Before = before.steps.find((step) => step.level === 'a2');
    expect(a2Before?.courses).toBe(1);
    expect(a2Before?.totalLessons).toBe(2);
    expect(a2Before?.doneLessons).toBe(0);

    await saveLessonProgress({
      userId: user.id,
      lessonId: a2.lessonIds[0],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });
    const after = await getRoadmapData(user.id);
    const a2After = after.steps.find((step) => step.level === 'a2');
    expect(a2After?.doneLessons).toBe(1);
    expect(a2After?.totalLessons).toBe(2);
  });

  it('excludes unpublished courses from every aggregate', async () => {
    const user = await seedUser();
    const courseId = newId('crs');
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'Draft', 'd', 'b1', 'General', '📘', 'brand', 0, 0, ?, ?)`,
      courseId,
      `rm-draft-${courseId}`,
      nowIso(),
      nowIso(),
    );
    const data = await getRoadmapData(user.id);
    // No published B1 content exists: the level must not appear at all.
    expect(data.steps.find((step) => step.level === 'b1')).toBeUndefined();
  });
});

describe('dashboard extras (sprint 5)', () => {
  async function seedUser(name = 'Dashboard Learner') {
    return createUser({
      email: `db-${newId('u')}@test.dev`,
      name,
      passwordHash: 'hash',
    });
  }

  async function seedCourseWithLessons(lessonMinutes: number[], position = 99) {
    const courseId = newId('crs');
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'Dash Course', 'desc', 'a1', 'General', '📘', 'brand', 1, ?, ?, ?)`,
      courseId,
      `db-${courseId}`,
      position,
      nowIso(),
      nowIso(),
    );
    const lessonIds: string[] = [];
    const lessonSlugs: string[] = [];
    for (let i = 0; i < lessonMinutes.length; i += 1) {
      const lessonId = newId('les');
      await run(
        `INSERT INTO lessons (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, 's', 'b', 't', ?, ?, ?, ?)`,
        lessonId,
        courseId,
        `db-l-${lessonId}`,
        `Dash Lesson ${i + 1}`,
        lessonMinutes[i],
        i + 1,
        nowIso(),
        nowIso(),
      );
      lessonIds.push(lessonId);
      lessonSlugs.push(`db-l-${lessonId}`);
    }
    return { courseId, lessonIds, lessonSlugs };
  }

  it('getDailyProgress counts distinct lessons touched today against the goal', async () => {
    const user = await seedUser();
    const { lessonIds } = await seedCourseWithLessons([10, 20]);

    const before = await getDailyProgress(user.id);
    expect(before).toMatchObject({ minutesToday: 0, lessonsTouchedToday: 0, completedToday: 0 });

    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[0],
      positionSeconds: 10,
      percent: 50,
      status: 'IN_PROGRESS',
    });
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[1],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });

    const progress = await getDailyProgress(user.id);
    expect(progress.minutesToday).toBe(30);
    expect(progress.lessonsTouchedToday).toBe(2);
    expect(progress.completedToday).toBe(1);
    expect(progress.goalMinutes).toBe(15); // default goal
    expect(progress.percent).toBe(100); // 30 of 15 minutes → clamped
  });

  it('getDailyProgress uses the configured goal, not the default', async () => {
    const user = await seedUser();
    await updateSettings(user.id, { dailyGoalMinutes: 60 });
    const progress = await getDailyProgress(user.id);
    expect(progress.goalMinutes).toBe(60);
    expect(progress.percent).toBe(0);
  });

  it('getContinueLearning returns the most recently touched in-progress lesson', async () => {
    const user = await seedUser();
    const { lessonIds } = await seedCourseWithLessons([10, 10]);
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[0],
      positionSeconds: 0,
      percent: 40,
      status: 'IN_PROGRESS',
    });
    expect((await getContinueLearning(user.id))?.lessonSlug).toBe(`db-l-${lessonIds[0]}`);

    // Touch the second lesson later — it becomes the resume target.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[1],
      positionSeconds: 5,
      percent: 20,
      status: 'IN_PROGRESS',
    });
    const latest = await getContinueLearning(user.id);
    expect(latest?.lessonSlug).toBe(`db-l-${lessonIds[1]}`);
    expect(latest?.courseSlug).toMatch(/^db-/);
    expect(latest?.percent).toBe(20);
  });

  it('getContinueLearning ignores completed lessons and unpublished courses', async () => {
    const user = await seedUser();
    const published = await seedCourseWithLessons([10], 98);
    await saveLessonProgress({
      userId: user.id,
      lessonId: published.lessonIds[0],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });

    // Draft course with an in-progress lesson — must be ignored.
    const draftCourseId = newId('crs');
    await run(
      `INSERT INTO courses (id, slug, title, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, 'Draft', 'd', 'a1', 'General', '📘', 'brand', 0, 97, ?, ?)`,
      draftCourseId,
      `db-draft-${draftCourseId}`,
      nowIso(),
      nowIso(),
    );
    const draftLessonId = newId('les');
    await run(
      `INSERT INTO lessons (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, created_at, updated_at)
       VALUES (?, ?, ?, 'Draft Lesson', 's', 'b', 't', 5, 1, ?, ?)`,
      draftLessonId,
      draftCourseId,
      `db-dl-${draftLessonId}`,
      nowIso(),
      nowIso(),
    );
    await saveLessonProgress({
      userId: user.id,
      lessonId: draftLessonId,
      positionSeconds: 0,
      percent: 10,
      status: 'IN_PROGRESS',
    });

    expect(await getContinueLearning(user.id)).toBeNull();
    // Recent lessons legitimately include the completed published lesson,
    // but the draft course's in-progress lesson must stay invisible.
    const recent = await listRecentLessons(user.id);
    expect(recent.map((lesson) => lesson.lessonSlug)).toEqual([`db-l-${published.lessonIds[0]}`]);
    expect(recent[0].status).toBe('COMPLETED');
  });

  it('listRecentLessons mixes in-progress and completed lessons newest-first', async () => {
    const user = await seedUser();
    const { lessonIds } = await seedCourseWithLessons([10, 10, 10]);
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[0],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[1],
      positionSeconds: 3,
      percent: 30,
      status: 'IN_PROGRESS',
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[2],
      positionSeconds: 1,
      percent: 10,
      status: 'IN_PROGRESS',
    });

    const recent = await listRecentLessons(user.id, 4);
    expect(recent.map((lesson) => lesson.lessonSlug)).toEqual([
      `db-l-${lessonIds[2]}`,
      `db-l-${lessonIds[1]}`,
      `db-l-${lessonIds[0]}`,
    ]);
    expect(recent[2].status).toBe('COMPLETED');
    expect(recent[0].percent).toBe(10);
  });

  it('getNextRecommendedCourse picks the first unfinished course with lessons', async () => {
    const user = await seedUser();
    // Negative positions sort before every other seeded course in the shared
    // test database, so the recommendation is deterministic.
    const first = await seedCourseWithLessons([10, 10], -1000);
    const second = await seedCourseWithLessons([10], -999);

    const initial = await getNextRecommendedCourse(user.id);
    expect(initial?.id).toBe(first.courseId); // lowest position wins

    // Complete everything in the first course → recommendation moves on.
    for (const lessonId of first.lessonIds) {
      await saveLessonProgress({
        userId: user.id,
        lessonId,
        positionSeconds: 0,
        percent: 100,
        status: 'COMPLETED',
      });
    }
    const next = await getNextRecommendedCourse(user.id);
    expect(next?.id).toBe(second.courseId);
  });

  it('getCourseUnits lists units in order and lessons keep their unit link', async () => {
    const { courseId, lessonIds } = await seedCourseWithLessons([10, 10, 10]);
    const unitA = newId('unt');
    const unitB = newId('unt');
    for (const [unitId, title, position] of [
      [unitA, 'Unit A', 2],
      [unitB, 'Unit B', 1],
    ] as const) {
      await run(
        `INSERT INTO course_units (id, course_id, title, summary, position, created_at, updated_at)
         VALUES (?, ?, ?, 'unit summary', ?, ?, ?)`,
        unitId,
        courseId,
        title,
        position,
        nowIso(),
        nowIso(),
      );
    }
    await run('UPDATE lessons SET unit_id = ? WHERE id = ?', unitB, lessonIds[0]);
    await run('UPDATE lessons SET unit_id = ? WHERE id = ?', unitA, lessonIds[1]);
    // lessonIds[2] stays ungrouped.

    const units = await getCourseUnits(courseId);
    expect(units.map((unit) => unit.title)).toEqual(['Unit B', 'Unit A']);
    expect(units[0].courseId).toBe(courseId);
    expect(units[0].summary).toBe('unit summary');
  });

  it('getCourseUnits degrades to [] on a pre-migration database (no course_units table)', async () => {
    // Simulate production before `npm run db:migrate`: the table is absent.
    // CASCADE is required because lessons.unit_id references the table.
    await pglite.exec('DROP TABLE IF EXISTS course_units CASCADE');
    const units = await getCourseUnits('any_course');
    expect(units).toEqual([]);
    // Restore the schema for the following tests. SCHEMA_SQL is idempotent,
    // but `ADD COLUMN IF NOT EXISTS` skips the existing unit_id column, so the
    // CASCADE-dropped foreign key must be re-created explicitly. Earlier tests
    // may have left unit_id values pointing at units destroyed with the table,
    // so dangling references are nulled first or the FK validation would fail.
    await pglite.exec(SCHEMA_SQL);
    await pglite.exec(`
      UPDATE lessons SET unit_id = NULL
        WHERE unit_id IS NOT NULL AND unit_id NOT IN (SELECT id FROM course_units);
      ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_unit_id_fkey;
      ALTER TABLE lessons ADD CONSTRAINT lessons_unit_id_fkey
        FOREIGN KEY (unit_id) REFERENCES course_units(id) ON DELETE SET NULL;
    `);
    const restored = await getCourseUnits('any_course');
    expect(restored).toEqual([]);
  });

  it('deleting a unit nulls the lessons it owned instead of deleting them', async () => {
    const { courseId, lessonIds } = await seedCourseWithLessons([10]);
    const unitId = newId('unt');
    await run(
      `INSERT INTO course_units (id, course_id, title, summary, position, created_at, updated_at)
       VALUES (?, ?, 'Doomed Unit', 's', 1, ?, ?)`,
      unitId,
      courseId,
      nowIso(),
      nowIso(),
    );
    await run('UPDATE lessons SET unit_id = ? WHERE id = ?', unitId, lessonIds[0]);
    await run('DELETE FROM course_units WHERE id = ?', unitId);
    const lesson = await one<{ unit_id: string | null }>(
      'SELECT unit_id FROM lessons WHERE id = ?',
      lessonIds[0],
    );
    expect(lesson?.unit_id).toBeNull();
  });

  it('getLearnerMilestones counts completed lessons, passed quizzes, stories and reviews', async () => {
    const user = await seedUser();
    const { lessonIds } = await seedCourseWithLessons([10, 10]);
    await saveLessonProgress({
      userId: user.id,
      lessonId: lessonIds[0],
      positionSeconds: 0,
      percent: 100,
      status: 'COMPLETED',
    });

    // Published quiz, pass threshold 50: attempt at 50% passes, 25% does not.
    const quizId = newId('qz');
    await run(
      `INSERT INTO quizzes (id, slug, title, description, level, is_published, position, pass_percent, created_at, updated_at)
       VALUES (?, ?, 'Milestone Quiz', 'd', 'a1', 1, 1, 50, ?, ?)`,
      quizId,
      `db-q-${quizId}`,
      nowIso(),
      nowIso(),
    );
    await saveQuizAttempt({
      userId: user.id,
      quizId,
      scorePoints: 1,
      maxPoints: 4,
      correctCount: 1,
      totalQuestions: 4,
      answers: '[]',
    });
    expect((await getLearnerMilestones(user.id)).quizzesPassed).toBe(0);
    await saveQuizAttempt({
      userId: user.id,
      quizId,
      scorePoints: 2,
      maxPoints: 4,
      correctCount: 2,
      totalQuestions: 4,
      answers: '[]',
    });
    expect((await getLearnerMilestones(user.id)).quizzesPassed).toBe(1);

    // Unpublished quiz attempt never counts.
    const draftQuizId = newId('qz');
    await run(
      `INSERT INTO quizzes (id, slug, title, description, level, is_published, position, pass_percent, created_at, updated_at)
       VALUES (?, ?, 'Draft Quiz', 'd', 'a1', 0, 1, 10, ?, ?)`,
      draftQuizId,
      `db-dq-${draftQuizId}`,
      nowIso(),
      nowIso(),
    );
    await saveQuizAttempt({
      userId: user.id,
      quizId: draftQuizId,
      scorePoints: 3,
      maxPoints: 3,
      correctCount: 3,
      totalQuestions: 3,
      answers: '[]',
    });
    expect((await getLearnerMilestones(user.id)).quizzesPassed).toBe(1);

    const milestones = await getLearnerMilestones(user.id);
    expect(milestones.lessonsCompleted).toBe(1);
    expect(milestones.storiesStarted).toBe(0);
    expect(milestones.reviewsDone).toBe(0);
  });

  it('new course profile columns default to safe empty values', async () => {
    const { courseId } = await seedCourseWithLessons([10]);
    const row = await one<{
      objectives: string;
      skills: string;
      estimated_hours: number | null;
      prerequisites: string;
      final_quiz_id: string | null;
      has_certificate: number;
    }>('SELECT objectives, skills, estimated_hours, prerequisites, final_quiz_id, has_certificate FROM courses WHERE id = ?', courseId);
    expect(row).toMatchObject({
      objectives: '',
      skills: '',
      estimated_hours: null,
      prerequisites: '',
      final_quiz_id: null,
      has_certificate: 0,
    });
  });
});
