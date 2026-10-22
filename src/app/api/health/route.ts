import { one } from '@/lib/db/client';

export async function GET() {
  try {
    const row = await one<{ c: number }>(
      'SELECT COUNT(*)::int AS c FROM courses WHERE is_published = 1',
    );
    return Response.json({
      status: 'ok',
      database: 'connected',
      courses: row?.c ?? 0,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 },
    );
  }
}
