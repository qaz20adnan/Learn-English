import { Pool, type PoolClient, types } from 'pg';

/**
 * PostgreSQL connection layer.
 *
 * The app runs on Netlify Functions, where the filesystem is ephemeral, so the
 * database lives in a hosted PostgreSQL instance (Neon, Supabase, Railway, ...).
 * Set `DATABASE_URL` to the connection string. For Neon use the *pooled*
 * connection string (host contains `-pooler`).
 */

// node-postgres returns BIGINT (int8) and NUMERIC values as strings to avoid
// precision loss. Every BIGINT here is a COUNT/SUM that comfortably fits in a
// JS number, so parse them as numbers to keep the existing row types unchanged.
types.setTypeParser(20, (value) => Number(value)); // int8
types.setTypeParser(1700, (value) => Number(value)); // numeric

declare global {
  var __academyPool: Pool | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your PostgreSQL connection string to .env.local (and to the Netlify environment variables).',
    );
  }
  return url;
}

function sslFor(url: string): { rejectUnauthorized: boolean } | undefined {
  if (process.env.DATABASE_SSL === 'disable') return undefined;
  if (process.env.DATABASE_SSL === 'require') return { rejectUnauthorized: false };
  try {
    const host = new URL(url).hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return undefined;
  } catch {
    // Fall through to SSL for anything we cannot parse.
  }
  return { rejectUnauthorized: false };
}

export function getPool(): Pool {
  if (!globalThis.__academyPool) {
    const url = connectionString();
    globalThis.__academyPool = new Pool({
      connectionString: url,
      ssl: sslFor(url),
      max: Number(process.env.DATABASE_POOL_MAX ?? 3),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalThis.__academyPool;
}

/**
 * Test-only hook. Integration tests swap the pool for an embedded PostgreSQL
 * (PGlite) so the query layer can be exercised without a network database.
 */
interface QueryExecutor {
  query(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
  exec?(sql: string): Promise<void>;
}

let executor: QueryExecutor | undefined;

export function setQueryExecutor(next?: QueryExecutor): void {
  executor = next;
}

/**
 * Translates SQLite-style positional placeholders (`?`) into PostgreSQL's
 * `$1, $2, ...`, skipping anything inside single-quoted string literals.
 */
export function toPgPlaceholders(sql: string): string {
  let index = 0;
  let inString = false;
  let out = '';
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    if (char === "'") {
      // SQL escapes a quote inside a literal by doubling it.
      if (inString && sql[i + 1] === "'") {
        out += "''";
        i += 1;
        continue;
      }
      inString = !inString;
      out += char;
      continue;
    }
    if (char === '?' && !inString) {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += char;
  }
  return out;
}

/** Runs a query and returns every row. */
export async function all<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const text = toPgPlaceholders(sql);
  if (executor) {
    return (await executor.query(text, params)).rows as T[];
  }
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

/** Runs a query and returns the first row, or `undefined`. */
export async function one<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | undefined> {
  const rows = await all<T>(sql, ...params);
  return rows[0];
}

/** Runs a statement and returns the number of affected rows. */
export async function run(sql: string, ...params: unknown[]): Promise<number> {
  const text = toPgPlaceholders(sql);
  if (executor) {
    return (await executor.query(text, params)).rowCount ?? 0;
  }
  const result = await getPool().query(text, params);
  return result.rowCount ?? 0;
}

/** Executes a multi-statement script (schema setup, maintenance, ...). */
export async function exec(sql: string): Promise<void> {
  if (executor) {
    if (executor.exec) {
      await executor.exec(sql);
      return;
    }
    await executor.query(sql);
    return;
  }
  await getPool().query(sql);
}

/**
 * Runs `fn` inside a transaction. The callback receives a query runner bound to
 * the same client; use it for every statement that must be atomic.
 */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors and surface the original failure.
    }
    throw error;
  } finally {
    client.release();
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
