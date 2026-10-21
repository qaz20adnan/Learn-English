/**
 * Verifies every media URL against its provider's official API and records the
 * real result. Requires outbound network access.
 *
 * Usage: npm run db:verify-media
 */
import { all, nowIso, run } from '../src/lib/db/client';
import { verifyMediaUrl } from '../src/lib/media';
import type { MediaProvider, VerificationStatus } from '../src/lib/types';

interface Row {
  id: string;
  provider: MediaProvider;
  external_id: string | null;
  url: string | null;
  title: string | null;
}

async function main(): Promise<void> {
  const rows = await all<Row>('SELECT id, provider, external_id, url, title FROM media');

  if (rows.length === 0) {
    console.log('No media rows found. Run `npm run db:seed` first.');
    return;
  }

  const results: { title: string; status: VerificationStatus; note: string }[] = [];

  for (const row of rows) {
    const result = await verifyMediaUrl(row.provider, row.external_id, row.url);
    await run(
      'UPDATE media SET verification_status = ?, verification_note = ?, last_checked_at = ?, updated_at = ? WHERE id = ?',
      result.status,
      result.note,
      nowIso(),
      nowIso(),
      row.id,
    );
    results.push({ title: row.title ?? row.url ?? row.id, status: result.status, note: result.note });
  }

  console.table(results);
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
