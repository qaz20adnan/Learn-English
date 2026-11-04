/**
 * Applies the PostgreSQL schema to the database referenced by DATABASE_URL.
 *
 * Usage: npm run db:setup
 */
import { all, exec } from '../src/lib/db/client';
import { SCHEMA_SQL } from '../src/lib/db/schema';
import { applyPendingMigrations } from '../src/lib/db/migrations';

async function main(): Promise<void> {
  await exec(SCHEMA_SQL);
  // Record the migration ledger so `db:migrate --down` knows the base state.
  const appliedNow = await applyPendingMigrations();
  const tables = await all<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );

  console.log('Database ready.');
  console.log(`Tables (${tables.length}): ${tables.map((t) => t.table_name).join(', ')}`);
  console.log(
    appliedNow.length > 0
      ? `Recorded ${appliedNow.length} migration(s): ${appliedNow.join(', ')}`
      : 'Migration ledger up to date.',
  );
}

main().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
