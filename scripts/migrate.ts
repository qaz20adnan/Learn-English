/**
 * Migration CLI (IMPROVEMENT_PLAN rule #2).
 *
 * Usage:
 *   npm run db:migrate            Apply every pending migration, in order.
 *   npm run db:migrate -- --down  Roll back the most recently applied one.
 *
 * Every run is recorded in `schema_migrations`. `up` scripts are additive and
 * rerunnable; `down` scripts remove exactly what `up` added. Rollbacks are
 * only allowed at the tail of the applied chain (see migrations.ts).
 */
import { applyPendingMigrations, listAppliedMigrationIds, rollbackLastMigration } from '../src/lib/db/migrations';

async function main(): Promise<void> {
  const wantsDown = process.argv.slice(2).includes('--down');

  if (wantsDown) {
    const rolledBack = await rollbackLastMigration();
    if (rolledBack) {
      console.log(`Rolled back migration: ${rolledBack}`);
    } else {
      console.log('Nothing to roll back — no migrations are recorded as applied.');
    }
  } else {
    const appliedBefore = await listAppliedMigrationIds();
    const appliedNow = await applyPendingMigrations();
    if (appliedNow.length === 0) {
      console.log(`Database is up to date (${appliedBefore.length} migration(s) recorded).`);
    } else {
      console.log(`Applied ${appliedNow.length} migration(s):`);
      for (const id of appliedNow) console.log(`  ✓ ${id}`);
    }
  }

  const all = await listAppliedMigrationIds();
  console.log(`Recorded migrations: ${all.length ? all.join(', ') : '(none)'}`);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
