/**
 * Creates the SQLite database file and applies the schema.
 *
 * Usage: npm run db:setup
 */
import { getDb, resolveDbPath } from '../src/lib/db/client';

const db = getDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as { name: string }[];

console.log(`Database ready at: ${resolveDbPath()}`);
console.log(`Tables (${tables.length}): ${tables.map((t) => t.name).join(', ')}`);
