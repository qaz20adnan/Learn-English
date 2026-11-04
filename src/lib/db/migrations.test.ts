// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { setQueryExecutor } from './client';
import { SCHEMA_SQL } from './schema';
import {
  applyPendingMigrations,
  listAppliedMigrationIds,
  MIGRATIONS,
  rollbackLastMigration,
  rollbackMigration,
} from './migrations';

const pglite = new PGlite();

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await pglite.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return (result.rows[0]?.c ?? 0) > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const result = await pglite.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM information_schema.tables
     WHERE table_name = $1 AND table_type = 'BASE TABLE'`,
    [table],
  );
  return (result.rows[0]?.c ?? 0) > 0;
}

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

describe('migrations', () => {
  it('SCHEMA_SQL already ships every sprint-5 structure (fresh install path)', async () => {
    for (const column of [
      'objectives',
      'skills',
      'estimated_hours',
      'prerequisites',
      'final_quiz_id',
      'has_certificate',
    ]) {
      expect(await columnExists('courses', column)).toBe(true);
    }
    expect(await columnExists('lessons', 'unit_id')).toBe(true);
    expect(await tableExists('course_units')).toBe(true);
  });

  it('applies pending migrations, records them, and is idempotent', async () => {
    expect(await listAppliedMigrationIds()).toEqual([]);
    const firstRun = await applyPendingMigrations();
    expect(firstRun).toEqual(MIGRATIONS.map((migration) => migration.id));
    // Second run is a no-op.
    expect(await applyPendingMigrations()).toEqual([]);
    expect(await listAppliedMigrationIds()).toEqual(MIGRATIONS.map((migration) => migration.id));
  });

  it('rolls back the last migration (course_units) and restores it on re-apply', async () => {
    const lastId = MIGRATIONS[MIGRATIONS.length - 1].id;
    expect(await rollbackLastMigration()).toBe(lastId);
    expect(await tableExists('course_units')).toBe(false);
    expect(await columnExists('lessons', 'unit_id')).toBe(false);
    expect(await listAppliedMigrationIds()).toEqual(
      MIGRATIONS.slice(0, MIGRATIONS.length - 1).map((migration) => migration.id),
    );

    // Re-apply restores everything and stays recorded.
    expect(await applyPendingMigrations()).toEqual([lastId]);
    expect(await tableExists('course_units')).toBe(true);
    expect(await columnExists('lessons', 'unit_id')).toBe(true);
  });

  it('rolls back both migrations in reverse order (down removes exactly what up added)', async () => {
    // Reverse order: the later units migration goes first...
    expect(await rollbackLastMigration()).toBe(MIGRATIONS[1].id);
    expect(await tableExists('course_units')).toBe(false);
    expect(await columnExists('lessons', 'unit_id')).toBe(false);
    // ...then the profile migration.
    expect(await rollbackLastMigration()).toBe(MIGRATIONS[0].id);
    expect(await columnExists('courses', 'objectives')).toBe(false);
    expect(await columnExists('courses', 'skills')).toBe(false);
    expect(await columnExists('courses', 'estimated_hours')).toBe(false);
    expect(await columnExists('courses', 'prerequisites')).toBe(false);
    expect(await columnExists('courses', 'final_quiz_id')).toBe(false);
    expect(await columnExists('courses', 'has_certificate')).toBe(false);
    expect(await listAppliedMigrationIds()).toEqual([]);

    // Full re-apply brings both back in order.
    expect(await applyPendingMigrations()).toEqual(MIGRATIONS.map((migration) => migration.id));
    expect(await columnExists('courses', 'objectives')).toBe(true);
    expect(await tableExists('course_units')).toBe(true);
  });

  it('refuses to roll back a migration that is not at the tail', async () => {
    await expect(rollbackMigration(MIGRATIONS[0].id)).rejects.toThrow(/not the last applied/);
  });

  it('refuses to roll back an unknown or unapplied migration', async () => {
    await expect(rollbackMigration('does_not_exist')).rejects.toThrow(/Unknown migration/);
    // Roll everything back, then the first migration is unapplied again.
    await rollbackLastMigration();
    await rollbackLastMigration();
    expect(await listAppliedMigrationIds()).toEqual([]);
    await expect(rollbackMigration(MIGRATIONS[0].id)).rejects.toThrow(/not recorded as applied/);
    // Leave the DB in the fully-applied state for later expectations.
    await applyPendingMigrations();
  });
});
