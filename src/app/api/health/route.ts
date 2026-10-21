import { getDb } from '@/lib/db/client';

export async function GET() {
  try {
    const row = getDb().prepare('SELECT COUNT(*) AS c FROM courses').get() as { c: number };
    return Response.json({
      status: 'ok',
      database: 'connected',
      courses: row.c,
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
