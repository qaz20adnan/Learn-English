import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { SCHEMA_SQL } from './schema';

declare global {
  var __academyDb: DatabaseSync | undefined;
}

const DEFAULT_DB_PATH = './data/academy.db';

export function resolveDbPath(): string {
  const raw = process.env.DATABASE_PATH?.trim() || DEFAULT_DB_PATH;
  if (raw === ':memory:') return raw;
  return isAbsolute(raw) ? raw : resolve(/* turbopackIgnore: true */ process.cwd(), raw);
}

function hasColumn(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[];
  return rows.some((row) => row.name === column);
}

/** Forward-only, idempotent migrations for databases created by older versions. */
function migrate(db: DatabaseSync): void {
  if (!hasColumn(db, 'vocabulary', 'created_by')) {
    db.exec(
      'ALTER TABLE vocabulary ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE CASCADE',
    );
  }
  if (!hasColumn(db, 'vocabulary', 'lesson_id')) {
    db.exec('ALTER TABLE vocabulary ADD COLUMN lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE');
  }
  if (!hasColumn(db, 'courses', 'playlist_id')) {
    db.exec('ALTER TABLE courses ADD COLUMN playlist_id TEXT');
  }
  if (!hasColumn(db, 'courses', 'level_group')) {
    db.exec('ALTER TABLE courses ADD COLUMN level_group INTEGER NOT NULL DEFAULT 1');
  }
  // Indexes that depend on columns added by the migrations above must be
  // created *after* the ALTER TABLE statements, so legacy databases upgrade
  // cleanly instead of failing on an index over a missing column.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_courses_playlist ON courses(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson ON vocabulary(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_owner ON vocabulary(created_by);
  `);

  // The shared word bank must contain each English term only once. Historical
  // databases stored one row per lesson, which filled the bank with duplicates
  // (e.g. "abroad" dozens of times). This forward-only migration:
  //   1. picks a canonical row per lower-cased term,
  //   2. moves every lesson link onto the canonical row,
  //   3. re-points favourites and review cards, then deletes the duplicates,
  //   4. enforces uniqueness with a partial index so learner-owned words are
  //      still free to repeat a shared term.
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_vocabulary (
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      vocab_id  TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
      position  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (lesson_id, vocab_id)
    );
    CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary ON lesson_vocabulary(lesson_id, position);

    DROP TABLE IF EXISTS _vocab_canon;
    CREATE TEMP TABLE _vocab_canon AS
      SELECT lower(term) AS lterm, MIN(id) AS canon_id
      FROM vocabulary
      WHERE created_by IS NULL
      GROUP BY lower(term);

    INSERT OR IGNORE INTO lesson_vocabulary (lesson_id, vocab_id, position)
      SELECT v.lesson_id, c.canon_id, 0
      FROM vocabulary v
      JOIN _vocab_canon c ON lower(v.term) = c.lterm
      WHERE v.lesson_id IS NOT NULL AND v.created_by IS NULL;

    UPDATE OR IGNORE vocab_favorites
      SET vocab_id = (
        SELECT c.canon_id FROM _vocab_canon c
        JOIN vocabulary v ON lower(v.term) = c.lterm
        WHERE v.id = vocab_favorites.vocab_id
      )
      WHERE vocab_id IN (SELECT id FROM vocabulary WHERE created_by IS NULL);

    UPDATE OR IGNORE vocab_review
      SET vocab_id = (
        SELECT c.canon_id FROM _vocab_canon c
        JOIN vocabulary v ON lower(v.term) = c.lterm
        WHERE v.id = vocab_review.vocab_id
      )
      WHERE vocab_id IN (SELECT id FROM vocabulary WHERE created_by IS NULL);

    DELETE FROM vocabulary
      WHERE created_by IS NULL
        AND id NOT IN (SELECT canon_id FROM _vocab_canon);

    -- Lesson association now lives in the lesson_vocabulary table.
    UPDATE vocabulary SET lesson_id = NULL WHERE created_by IS NULL;

    DROP TABLE IF EXISTS _vocab_canon;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_shared_term
      ON vocabulary(term COLLATE NOCASE) WHERE created_by IS NULL;
  `);
}

function createDb(): DatabaseSync {
  const path = resolveDbPath();
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(SCHEMA_SQL);
  migrate(db);
  return db;
}

/**
 * Returns the process-wide SQLite connection.
 *
 * The instance is cached on `globalThis` so that Next.js hot-reloads in
 * development do not open a new file handle on every request.
 */
export function getDb(): DatabaseSync {
  if (!globalThis.__academyDb) {
    globalThis.__academyDb = createDb();
  }
  return globalThis.__academyDb;
}

/** Used by CLI scripts to get a fresh, explicit connection. */
export function openDb(): DatabaseSync {
  return createDb();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
