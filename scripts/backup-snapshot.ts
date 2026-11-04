/**
 * Pre-migration logical snapshot (layer-2 backup).
 *
 * Exports every user table of the database referenced by DATABASE_URL into a
 * single timestamped JSON file with a row-count manifest. Read-only: it never
 * writes to the database. Run BEFORE `npm run db:migrate`.
 *
 *   npx tsx --env-file-if-exists=.env.local scripts/backup-snapshot.ts
 *
 * Output: download-fluently/backup-<timestamp>.json (outside the repo tree).
 * The connection string is read from the environment only — never printed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { all } from '../src/lib/db/client';

/** Every table in SCHEMA_SQL (verified against schema.ts — parents first). */
const TABLES = [
  'users',
  'sessions',
  'user_settings',
  'media',
  'youtube_cache',
  'courses',
  'course_units',
  'lessons',
  'lesson_vocabulary',
  'quizzes',
  'quiz_questions',
  'quiz_attempts',
  'quiz_sessions',
  'stories',
  'story_questions',
  'story_attempts',
  'vocabulary',
  'vocab_favorites',
  'vocab_review',
  'lesson_progress',
  'points_ledger',
  'playback_failures',
  'audit_log',
  'schema_migrations',
] as const;

async function existingTables(): Promise<string[]> {
  const rows = await all<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC`,
  );
  return rows.map((r) => r.table_name);
}

async function main(): Promise<void> {
  const present = new Set(await existingTables());
  const dump: Record<string, unknown[]> = {};
  const manifest: Record<string, number> = {};

  for (const table of TABLES) {
    if (!present.has(table)) {
      manifest[table] = -1; // not in this database yet (e.g. course_units pre-migration)
      continue;
    }
    const rows = await all(`SELECT * FROM "${table}"`);
    dump[table] = rows;
    manifest[table] = rows.length;
  }

  const payload = {
    takenAt: new Date().toISOString(),
    purpose: 'pre-sprint5-migration snapshot',
    manifest,
    data: dump,
  };

  const dir = '/home/z/my-project/download';
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `fluently-db-backup-${payload.takenAt.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(payload, null, 1), 'utf8');

  console.log('Snapshot written:', file);
  for (const [table, n] of Object.entries(manifest)) {
    console.log(`  ${n === -1 ? '·' : '✓'} ${table}: ${n === -1 ? 'غير موجودة في هذه القاعدة' : `${n} صف`}`);
  }
  const total = Object.values(manifest).filter((n) => n >= 0).reduce((a, b) => a + b, 0);
  console.log(`Total rows captured: ${total}`);
}

main().catch((error) => {
  console.error('Snapshot failed:', error);
  process.exit(1);
});
