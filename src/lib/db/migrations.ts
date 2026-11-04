import { all, exec, nowIso, run } from './client';

/**
 * Reversible, ordered database migrations (IMPROVEMENT_PLAN rule #2).
 *
 * - `SCHEMA_SQL` in `./schema.ts` stays fully idempotent: it can always build
 *   a fresh database from scratch and safely top-up an existing one.
 * - This file adds the *step-down* half. Each migration ships an `up` script
 *   (additive, rerunnable) and a `down` script (removes exactly what `up`
 *   added, in reverse order). Nothing here runs automatically — the CLI in
 *   `scripts/migrate.ts` (`npm run db:migrate`) is the only entry point, and
 *   every run is recorded in the `schema_migrations` table.
 *
 * Statements must be plain multi-statement SQL without bind parameters
 * (they run through the simple query protocol). They may use `IF NOT EXISTS`
 * / `IF EXISTS` freely: a database that was already topped-up by `SCHEMA_SQL`
 * simply no-ops its way through `up`.
 */

export interface Migration {
  /** Sortable unique id; timestamp-prefixed by convention. */
  id: string;
  /** Human-readable summary (shown by the CLI and stored with the run). */
  name: string;
  /** Additive SQL, rerunnable on any database state. */
  up: string;
  /** Reverse SQL — removes exactly what `up` added. */
  down: string;
}

/** Applied-migration ledger. Created on demand by every CLI command. */
export const TRACKING_TABLE_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`;

/**
 * Sprint 5 (IMPROVEMENT_PLAN 3.2) — course profile columns. All six are
 * NULL-safe / defaulted so existing courses keep rendering unchanged.
 */
export const MIGRATION_COURSE_PROFILE: Migration = {
  id: '20261104_01_course_profile',
  name: 'Course profile: objectives, skills, estimated_hours, prerequisites, final_quiz_id, has_certificate',
  up: /* sql */ `
ALTER TABLE courses ADD COLUMN IF NOT EXISTS objectives TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skills TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_quiz_id TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_certificate INTEGER NOT NULL DEFAULT 0;
`,
  down: /* sql */ `
ALTER TABLE courses DROP COLUMN IF EXISTS has_certificate;
ALTER TABLE courses DROP COLUMN IF EXISTS final_quiz_id;
ALTER TABLE courses DROP COLUMN IF EXISTS prerequisites;
ALTER TABLE courses DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE courses DROP COLUMN IF EXISTS skills;
ALTER TABLE courses DROP COLUMN IF EXISTS objectives;
`,
};

/**
 * Sprint 5 (IMPROVEMENT_PLAN 3.4) — course units. `lessons.unit_id` is a real
 * FK with ON DELETE SET NULL, so removing a unit never removes a lesson; the
 * down script drops the column before the table it pointed at.
 */
export const MIGRATION_COURSE_UNITS: Migration = {
  id: '20261104_02_course_units',
  name: 'Course units table + lessons.unit_id link (NULL-safe, ON DELETE SET NULL)',
  up: /* sql */ `
CREATE TABLE IF NOT EXISTS course_units (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  title_ar   TEXT,
  summary    TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_course_units_course ON course_units(course_id, position);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS unit_id TEXT REFERENCES course_units(id) ON DELETE SET NULL;
`,
  down: /* sql */ `
ALTER TABLE lessons DROP COLUMN IF EXISTS unit_id;
DROP INDEX IF EXISTS idx_course_units_course;
DROP TABLE IF EXISTS course_units;
`,
};

export const MIGRATIONS: readonly Migration[] = [
  MIGRATION_COURSE_PROFILE,
  MIGRATION_COURSE_UNITS,
];

function findMigration(id: string): Migration | undefined {
  return MIGRATIONS.find((migration) => migration.id === id);
}

export async function ensureTrackingTable(): Promise<void> {
  await exec(TRACKING_TABLE_SQL);
}

export async function listAppliedMigrationIds(): Promise<string[]> {
  await ensureTrackingTable();
  const rows = await all<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id ASC');
  return rows.map((row) => row.id);
}

/**
 * Applies every pending migration in order and records it. Safe to run any
 * number of times; returns the ids that were applied during this call.
 */
export async function applyPendingMigrations(): Promise<string[]> {
  await ensureTrackingTable();
  const applied = new Set(await listAppliedMigrationIds());
  const appliedNow: string[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await exec(migration.up);
    await insertMigrationRecord(migration);
    appliedNow.push(migration.id);
  }
  return appliedNow;
}

/**
 * Rolls back the most recent applied migration (strict reverse order — an
 * earlier migration may only be reverted when everything after it is gone).
 * Returns the id that was rolled back, or null when nothing is pending.
 */
export async function rollbackLastMigration(): Promise<string | null> {
  const applied = await listAppliedMigrationIds();
  const lastId = applied[applied.length - 1];
  if (!lastId) return null;
  await rollbackMigration(lastId);
  return lastId;
}

/**
 * Rolls back a specific migration. Only allowed at the tail of the applied
 * chain so `down` scripts never run on top of a database state they do not
 * know about.
 */
export async function rollbackMigration(id: string): Promise<void> {
  const migration = findMigration(id);
  if (!migration) {
    throw new Error(`Unknown migration: ${id}`);
  }
  const applied = await listAppliedMigrationIds();
  if (!applied.includes(id)) {
    throw new Error(`Migration ${id} is not recorded as applied`);
  }
  if (applied[applied.length - 1] !== id) {
    throw new Error(
      `Migration ${id} is not the last applied migration (${applied[applied.length - 1]}); roll back later migrations first`,
    );
  }
  await exec(migration.down);
  await deleteMigrationRecord(id);
}

async function insertMigrationRecord(migration: Migration): Promise<void> {
  await run(
    'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
    migration.id,
    migration.name,
    nowIso(),
  );
}

async function deleteMigrationRecord(id: string): Promise<void> {
  await run('DELETE FROM schema_migrations WHERE id = ?', id);
}
