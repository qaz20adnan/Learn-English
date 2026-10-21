/**
 * Applies the PostgreSQL schema to the database referenced by DATABASE_URL.
 *
 * Usage: npm run db:setup
 */
import { all, exec } from '../src/lib/db/client';
import { SCHEMA_SQL } from '../src/lib/db/schema';

async function main(): Promise<void> {
  await exec(SCHEMA_SQL);
  const tables = await all<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );

  console.log('Database ready.');
  console.log(`Tables (${tables.length}): ${tables.map((t) => t.table_name).join(', ')}`);
}

main().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
