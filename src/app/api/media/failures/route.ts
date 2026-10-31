import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { mediaFailureSchema } from '@/lib/validation';
import { getMediaById, recordPlaybackFailure } from '@/lib/db/queries';

/**
 * Runtime playback failure reports from the in-page players (T10).
 *
 * The client sends a best-effort, fire-and-forget POST when a YouTube/Vimeo
 * embed signals an error. The endpoint verifies the session, re-validates the
 * media against the database (never trusting client metadata) and records the
 * failure with a 10-minute per-user dedupe window, so refresh loops cannot
 * flood the admin reliability board.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = mediaFailureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' },
      { status: 400 },
    );
  }

  // The media row must exist server-side; the client only supplies its id.
  const media = await getMediaById(parsed.data.mediaId);
  if (!media) {
    return NextResponse.json({ error: 'الوسيط غير موجود' }, { status: 404 });
  }

  const recorded = await recordPlaybackFailure({
    userId: user.id,
    mediaId: media.id,
    provider: media.provider,
    errorCode: parsed.data.errorCode,
    note: parsed.data.note,
  });

  return NextResponse.json({ ok: true, recorded });
}
