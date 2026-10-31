// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createUser,
  listQuizzesPaged,
  listRecentPlaybackFailures,
  recordPlaybackFailure,
} from './queries';
import { newId, nowIso, run, setQueryExecutor } from './client';
import { SCHEMA_SQL } from './schema';

/**
 * Integration tests for the Phase-0 quiz library (T3: search / filters /
 * pagination) and the media reliability layer (T10: playback failures).
 * Runs against a real PostgreSQL engine (PGlite) with the production schema.
 */

const pglite = new PGlite();

const ts = nowIso();

async function seedQuiz(overrides: {
  slug: string;
  title: string;
  titleAr?: string;
  level?: string;
  published?: number;
  passPercent?: number;
}) {
  const id = newId('qz');
  await run(
    `INSERT INTO quizzes (id, slug, title, title_ar, description, level, is_published, position, pass_percent, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    overrides.slug,
    overrides.title,
    overrides.titleAr ?? null,
    `وصف ${overrides.slug}`,
    overrides.level ?? 'a1',
    overrides.published ?? 1,
    0,
    overrides.passPercent ?? 70,
    ts,
    ts,
  );
  return id;
}

async function seedAttempt(quizId: string, userId: string, score: number, max: number) {
  await run(
    `INSERT INTO quiz_attempts (id, user_id, quiz_id, score_points, max_points, correct_count, total_questions, answers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId('att'),
    userId,
    quizId,
    score,
    max,
    score,
    max,
    '[]',
    ts,
  );
}

let user: { id: string };
let other: { id: string };

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

  user = await createUser({ email: 'lib@example.com', name: 'Learner', passwordHash: 'hash' });
  other = await createUser({ email: 'other@example.com', name: 'Other', passwordHash: 'hash' });

  // 25 published standalone quizzes → two pages at pageSize 24.
  await seedQuiz({ slug: 'present-simple', title: 'Present Simple Basics', level: 'a1' });
  await seedQuiz({ slug: 'past-perfect', title: 'Past Perfect Drill', level: 'b1' });
  await seedQuiz({ slug: 'a1-basics-ar', title: 'A1 Basics AR', titleAr: 'أساسيات المضارع البسيط', level: 'a1' });
  for (let i = 4; i <= 25; i += 1) {
    await seedQuiz({ slug: `filler-${i}`, title: `Filler Quiz ${i}`, level: 'a2' });
  }
  await seedQuiz({ slug: 'hidden-quiz', title: 'Hidden Unpublished', published: 0 });

  // Learner passed "present-simple" (90%) and failed "past-perfect" (50%).
  const ids = await pglite.query<{ id: string }>(
    "SELECT id FROM quizzes WHERE slug IN ('present-simple', 'past-perfect') ORDER BY slug",
  );
  const [pastPerfect, presentSimple] = ids.rows;
  await seedAttempt(presentSimple.id, user.id, 9, 10);
  await seedAttempt(pastPerfect.id, user.id, 5, 10);
}, 60_000);

afterAll(async () => {
  await pglite.close();
});

describe('listQuizzesPaged (T3)', () => {
  it('hides unpublished quizzes and counts the real total', async () => {
    const page = await listQuizzesPaged(user.id, { page: 1, pageSize: 24 });
    expect(page.total).toBe(25); // 26 seeded, 1 unpublished
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(24);
  });

  it('serves the second page and clamps out-of-range pages', async () => {
    const last = await listQuizzesPaged(user.id, { page: 2, pageSize: 24 });
    expect(last.items).toHaveLength(1);
    expect(last.page).toBe(2);

    const clamped = await listQuizzesPaged(user.id, { page: 99, pageSize: 24 });
    expect(clamped.page).toBe(2);
    expect(clamped.items).toHaveLength(1);
  });

  it('searches English titles case-insensitively', async () => {
    const page = await listQuizzesPaged(user.id, { q: 'PAST perfect', page: 1, pageSize: 24 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.slug).toBe('past-perfect');
  });

  it('searches Arabic titles', async () => {
    const page = await listQuizzesPaged(user.id, { q: 'المضارع', page: 1, pageSize: 24 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.slug).toBe('a1-basics-ar');
  });

  it('escapes LIKE wildcards in the search term', async () => {
    const page = await listQuizzesPaged(user.id, { q: '%', page: 1, pageSize: 24 });
    expect(page.total).toBe(0);
  });

  it('filters by level', async () => {
    const page = await listQuizzesPaged(user.id, { level: 'b1', page: 1, pageSize: 24 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.slug).toBe('past-perfect');
  });

  it('status=passed reflects the learner best attempts only', async () => {
    const page = await listQuizzesPaged(user.id, { status: 'passed', page: 1, pageSize: 24 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.slug).toBe('present-simple');
  });

  it('status=remaining includes failed and never-attempted quizzes', async () => {
    const page = await listQuizzesPaged(user.id, { status: 'remaining', page: 1, pageSize: 24 });
    expect(page.total).toBe(24); // 25 published − 1 passed
    const slugs = page.items.map((quiz) => quiz.slug);
    expect(slugs).toContain('past-perfect');
    expect(slugs).not.toContain('present-simple');
  });

  it('attempts of other users do not leak into the filters', async () => {
    await seedAttempt(await getQuizId('present-simple'), other.id, 10, 10);
    const page = await listQuizzesPaged(user.id, { status: 'remaining', page: 1, pageSize: 24 });
    expect(page.total).toBe(24);
    const otherPage = await listQuizzesPaged(other.id, { status: 'passed', page: 1, pageSize: 24 });
    expect(otherPage.total).toBe(1);
  });

  it('combines search, level and status in one query', async () => {
    const page = await listQuizzesPaged(user.id, {
      q: 'quiz',
      level: 'a2',
      status: 'remaining',
      page: 1,
      pageSize: 24,
    });
    expect(page.total).toBe(22); // filler-4..25
    expect(page.items).toHaveLength(22);
  });
});

async function getQuizId(slug: string): Promise<string> {
  const row = await pglite.query<{ id: string }>('SELECT id FROM quizzes WHERE slug = $1', [slug]);
  return row.rows[0].id;
}

describe('playback failures (T10)', () => {
  let mediaId: string;

  beforeAll(async () => {
    mediaId = newId('md');
    await run(
      `INSERT INTO media (id, provider, external_id, url, title, verification_status, created_at, updated_at)
       VALUES (?, 'YOUTUBE', 'dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'Sample', 'AVAILABLE', ?, ?)`,
      mediaId,
      ts,
      ts,
    );
  });

  it('records a failure once and dedupes the same failure within the window', async () => {
    const first = await recordPlaybackFailure({
      userId: user.id,
      mediaId,
      provider: 'YOUTUBE',
      errorCode: 101,
    });
    expect(first).toBe(true);

    const duplicate = await recordPlaybackFailure({
      userId: user.id,
      mediaId,
      provider: 'YOUTUBE',
      errorCode: 101,
    });
    expect(duplicate).toBe(false);
  });

  it('keeps distinct error codes and distinct users separate', async () => {
    const otherCode = await recordPlaybackFailure({
      userId: user.id,
      mediaId,
      provider: 'YOUTUBE',
      errorCode: 100,
    });
    expect(otherCode).toBe(true);

    const otherUser = await recordPlaybackFailure({
      userId: other.id,
      mediaId,
      provider: 'YOUTUBE',
      errorCode: 101,
    });
    expect(otherUser).toBe(true);
  });

  it('reports again after the dedupe window has passed', async () => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await run(
      'UPDATE playback_failures SET created_at = ? WHERE user_id = ? AND media_id = ? AND error_code = 101',
      hourAgo,
      user.id,
      mediaId,
    );

    const again = await recordPlaybackFailure({
      userId: user.id,
      mediaId,
      provider: 'YOUTUBE',
      errorCode: 101,
    });
    expect(again).toBe(true);
  });

  it('aggregates failures per media for the admin board', async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = await listRecentPlaybackFailures(since);
    const row = rows.find((entry) => entry.media_id === mediaId);
    expect(row).toBeDefined();
    expect(row?.failure_count).toBeGreaterThanOrEqual(3);
    expect(row?.provider).toBe('YOUTUBE');
    expect(row?.title).toBe('Sample');
  });
});
