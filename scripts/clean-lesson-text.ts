/**
 * Phase-0 data hygiene for lesson text (report items P2.5 + P2.6).
 *
 * 1. Descriptions (lessons + courses): mechanically removes leading/trailing
 *    blank lines, collapses runs of blank lines to a single one and strips
 *    per-line trailing whitespace. Lossless normalisation only — no words are
 *    ever added or removed.
 * 2. Titles: REPORT-ONLY. Prints suspicious patterns (trailing separators,
 *    double spaces, leading/trailing spaces, "Ep/Episode" suffix drift) so a
 *    human can decide; titles are never rewritten automatically.
 *
 * Dry-run by default. Writes only with `--write`, and only description rows
 * whose normalised value actually differs. Emits a JSON report to
 * `lesson-text-report.json`.
 *
 * Usage:
 *   npm run db:clean-text            (dry-run report)
 *   npm run db:clean-text -- --write
 */
import { writeFileSync } from 'node:fs';
import { all, nowIso, run } from '../src/lib/db/client';

interface TextRow {
  table: 'lessons' | 'courses';
  id: string;
  title: string;
  description: string;
}

const WRITE = process.argv.includes('--write');

/** Lossless normalisation: trim, collapse blank-line runs, strip line ends. */
export function normaliseDescription(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\s+$/g, '');
}

interface TitleIssue {
  kind: 'edge_space' | 'double_space' | 'trailing_separator' | 'episode_suffix';
  detail: string;
}

/** Report-only heuristics for inconsistent lesson titles. */
export function titleIssues(raw: string): TitleIssue[] {
  const issues: TitleIssue[] = [];
  if (raw !== raw.trim()) issues.push({ kind: 'edge_space', detail: raw });
  if (/ {2,}/.test(raw)) issues.push({ kind: 'double_space', detail: raw });
  if (/[|｜·\-–—:\u0640]\s*$/u.test(raw.trim()))
    issues.push({ kind: 'trailing_separator', detail: raw });
  if (/\b(Ep\.?|Episode)\s*\d+\s*$/i.test(raw))
    issues.push({ kind: 'episode_suffix', detail: raw });
  return issues;
}

async function main(): Promise<void> {
  const lessons = await all<TextRow>(
    "SELECT 'lessons' AS table, id, title, description FROM lessons ORDER BY position",
  );
  const courses = await all<TextRow>(
    "SELECT 'courses' AS table, id, title, description FROM courses ORDER BY created_at",
  );
  const rows: TextRow[] = [...lessons, ...courses];

  let descriptionChanged = 0;
  const changedRows: Array<{ table: string; title: string; before: number; after: number }> = [];
  const titleReport: Array<{ table: string; title: string; issues: TitleIssue[] }> = [];

  for (const row of rows) {
    const issues = titleIssues(row.title ?? '');
    if (issues.length > 0) {
      titleReport.push({ table: row.table, title: row.title, issues });
    }

    const cleaned = normaliseDescription(row.description ?? '');
    if (cleaned !== row.description) {
      descriptionChanged += 1;
      changedRows.push({
        table: row.table,
        title: row.title,
        before: row.description.length,
        after: cleaned.length,
      });
      if (WRITE) {
        await run(
          `UPDATE ${row.table} SET description = ?, updated_at = ? WHERE id = ?`,
          cleaned,
          nowIso(),
          row.id,
        );
      }
    }
  }

  const report = {
    generatedAt: nowIso(),
    mode: WRITE ? 'write' : 'dry-run',
    scanned: rows.length,
    descriptionsToFix: descriptionChanged,
    titleIssuesFound: titleReport.length,
    changedRows,
    titleReport,
  };

  writeFileSync('lesson-text-report.json', JSON.stringify(report, null, 2), 'utf8');

  console.log(
    `Scanned ${rows.length} rows (lessons + courses). ` +
      `Descriptions ${WRITE ? 'fixed' : 'to fix'}: ${descriptionChanged}. ` +
      `Title issues (report-only): ${titleReport.length}.`,
  );
  if (changedRows.length > 0) console.table(changedRows.slice(0, 20));
  if (titleReport.length > 0) console.table(titleReport.slice(0, 20));
  console.log('Full report: lesson-text-report.json');
  if (!WRITE && descriptionChanged > 0) {
    console.log('Re-run with `-- --write` to apply the description fixes.');
  }
}

// Exported helpers are unit-tested; only run main when executed directly.
if (process.argv[1] && process.argv[1].includes('clean-lesson-text')) {
  main().catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}
