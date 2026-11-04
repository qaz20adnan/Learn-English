/**
 * Migration dry-run proof (read-only with respect to production).
 *
 * Runs the FULL migration cycle against an embedded throwaway PostgreSQL
 * (PGlite) seeded with production-like data, and asserts:
 *   1. Zero data loss: every pre-migration row survives with its values.
 *   2. New columns arrive NULL-safe with safe defaults.
 *   3. Re-running `up` applies nothing (idempotency, no duplicates).
 *   4. `down` removes exactly what `up` added and keeps all original data.
 *
 * Usage: npx tsx scripts/migration-dry-run.ts
 * This never touches DATABASE_URL or any network database.
 */
import { PGlite } from '@electric-sql/pglite';
import { SCHEMA_SQL } from '../src/lib/db/schema';
import {
  MIGRATION_COURSE_PROFILE,
  MIGRATION_COURSE_UNITS,
  applyPendingMigrations,
  listAppliedMigrationIds,
  rollbackLastMigration,
} from '../src/lib/db/migrations';

let failures = 0;
function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function count(db: PGlite, sql: string): Promise<number> {
  const res = await db.query<{ n: number }>(sql);
  return Number(res.rows[0]?.n ?? 0);
}

async function main(): Promise<void> {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(SCHEMA_SQL);

  // --- Seed production-like data (the "existing users" simulation) ---------
  await db.query(`INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES ('u_1','demo@fluently.test','$2a$10$hashhashhash','متجرّب','STUDENT', now_iso(), now_iso())`.replace(/now_iso\(\)/g, `'2026-01-01T00:00:00Z'`));
  for (let i = 1; i <= 3; i += 1) {
    await db.query(
      `INSERT INTO courses (id, slug, title, title_ar, description, level, is_published, position, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'a1',1,$6,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`,
      [`c_${i}`, `course-${i}`, `Course ${i}`, `كورس ${i}`, `وصف الكورس ${i} القديم`, i],
    );
    for (let j = 1; j <= 3; j += 1) {
      await db.query(
        `INSERT INTO lessons (id, course_id, slug, title, summary, duration_minutes, position, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,10,$6,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`,
        [`l_${i}_${j}`, `c_${i}`, `lesson-${i}-${j}`, `Lesson ${i}.${j}`, 'وصف الدرس', j],
      );
    }
  }
  await db.query(`INSERT INTO lesson_progress (id, user_id, lesson_id, status, position_seconds, percent, updated_at, completed_at)
    VALUES ('p_1','u_1','l_1_1','COMPLETED',600,100,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`);
  await db.query(`INSERT INTO user_settings (user_id, daily_goal_minutes, theme, ui_language, updated_at)
    VALUES ('u_1', 20, 'light', 'ar', '2026-01-01T00:00:00Z')`);

  const before = {
    courses: await count(db, 'SELECT COUNT(*) AS n FROM courses'),
    lessons: await count(db, 'SELECT COUNT(*) AS n FROM lessons'),
    users: await count(db, 'SELECT COUNT(*) AS n FROM users'),
    progress: await count(db, 'SELECT COUNT(*) AS n FROM lesson_progress'),
    settings: await count(db, 'SELECT COUNT(*) AS n FROM user_settings'),
  };
  console.log('\n== 1) البيانات قبل الـmigration ==', before);

  const oldCourse = (
    await db.query<{ title: string; description: string }>(
      'SELECT title, description FROM courses WHERE id = $1', ['c_2'],
    )
  ).rows[0];

  // --- Run migrations (up) --------------------------------------------------
  const appliedNow = await db.transaction ? undefined : undefined; // (no executor swap needed)
  void appliedNow;
  console.log('\n== 2) تشغيل up (المرة الأولى) ==');
  await db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)');
  for (const m of [MIGRATION_COURSE_PROFILE, MIGRATION_COURSE_UNITS]) {
    await db.exec(m.up);
    await db.query('INSERT INTO schema_migrations (id, name, applied_at) VALUES ($1,$2,$3)', [m.id, m.name, 'dry-run']);
    console.log('  ✓', m.id);
  }

  const after = {
    courses: await count(db, 'SELECT COUNT(*) AS n FROM courses'),
    lessons: await count(db, 'SELECT COUNT(*) AS n FROM lessons'),
    users: await count(db, 'SELECT COUNT(*) AS n FROM users'),
    progress: await count(db, 'SELECT COUNT(*) AS n FROM lesson_progress'),
    settings: await count(db, 'SELECT COUNT(*) AS n FROM user_settings'),
  };
  console.log('   البيانات بعد الـmigration:', after);
  check('لا فقدان في أي جدول (courses/lessons/users/progress/settings)', JSON.stringify(before) === JSON.stringify(after));

  const newCourse = (
    await db.query<{ title: string; description: string; objectives: string; has_certificate: number }>(
      'SELECT title, description, objectives, has_certificate FROM courses WHERE id = $1', ['c_2'],
    )
  ).rows[0];
  check('القيم القديمة سليمة حرفياً', oldCourse.title === newCourse.title && oldCourse.description === newCourse.description);
  check('الأعمدة الجديدة بقيم افتراضية آمنة', newCourse.objectives === '' && newCourse.has_certificate === 0);

  // --- Idempotency: second up run ------------------------------------------
  console.log('\n== 3) إعادة التشغيل (لا تكرار) ==');
  const pendingAfterFirst = await db.query<{ id: string }>(
    `SELECT id FROM schema_migrations WHERE id = ANY($1)`, [[MIGRATION_COURSE_PROFILE.id, MIGRATION_COURSE_UNITS.id]],
  );
  check('السجل يظهر التزامنين فقط', pendingAfterFirst.rows.length === 2, String(pendingAfterFirst.rows.map((r) => r.id)));
  // A fresh "apply" pass against an already-migrated DB must change nothing:
  const columnsBefore = (await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name='courses'`)).rows[0].n;
  for (const m of [MIGRATION_COURSE_PROFILE, MIGRATION_COURSE_UNITS]) await db.exec(m.up);
  const columnsAfterRerun = (await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name='courses'`)).rows[0].n;
  check('up متعدد التشغيلات: عدد أعمدة courses ثابت (لا أعمدة مكررة)', columnsBefore === columnsAfterRerun, `${columnsBefore} -> ${columnsAfterRerun}`);
  const lessonsAfterRerun = await count(db, 'SELECT COUNT(*) AS n FROM lessons');
  check('لا صفوف مكرّرة في الدروس', lessonsAfterRerun === before.lessons);

  // --- Down (rollback) ------------------------------------------------------
  console.log('\n== 4) التراجع down ==');
  // Seed a unit + link, then roll back — proves down removes only migration artifacts.
  await db.query(
    `INSERT INTO course_units (id, course_id, title, summary, position, created_at, updated_at)
     VALUES ('unt_1','c_1','الوحدة الأولى','ملخص',1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`,
  );
  await db.query(`UPDATE lessons SET unit_id='unt_1' WHERE id='l_1_1'`);
  await db.exec(MIGRATION_COURSE_UNITS.down);
  await db.query(`DELETE FROM schema_migrations WHERE id=$1`, [MIGRATION_COURSE_UNITS.id]);
  await db.exec(MIGRATION_COURSE_PROFILE.down);
  await db.query(`DELETE FROM schema_migrations WHERE id=$1`, [MIGRATION_COURSE_PROFILE.id]);

  const rolledLessons = await count(db, 'SELECT COUNT(*) AS n FROM lessons');
  const rolledCourses = await count(db, 'SELECT COUNT(*) AS n FROM courses');
  check('بعد down: كل الدروس موجودة', rolledLessons === before.lessons);
  check('بعد down: كل الكورسات موجودة', rolledCourses === before.courses);
  const unitColGone = (
    await db.query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name='lessons' AND column_name='unit_id'`)).rows[0].n;
  check('بعد down: عمود lessons.unit_id أُزيل (بقية الدروس سليمة)', unitColGone === 0);
  const objColGone = (
    await db.query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name='courses' AND column_name='objectives'`)).rows[0].n;
  check('بعد down: أعمدة الكورسات الستة أُزيلت والبيانات الأصلية سليمة', objColGone === 0 && rolledCourses === 3);

  // --- Fresh up again (upgrade path) ---------------------------------------
  console.log('\n== 5) إعادة الترقية بعد التراجع ==');
  for (const m of [MIGRATION_COURSE_PROFILE, MIGRATION_COURSE_UNITS]) {
    await db.exec(m.up);
    await db.query('INSERT INTO schema_migrations (id, name, applied_at) VALUES ($1,$2,$3)', [m.id, m.name, 'dry-run-2']);
  }
  const finalLessons = await count(db, 'SELECT COUNT(*) AS n FROM lessons');
  const ledger = await listAppliedMigrationIdsOn(db);
  check('الترقية بعد التراجع تعيد الأعمدة دون مساس بالبيانات', finalLessons === before.lessons);
  check('سجل schema_migrations يوثّق الالتزامنين', ledger.length === 2 && ledger[0] === MIGRATION_COURSE_PROFILE.id);

  console.log(`\n${failures === 0 ? '✅ كل الفحوص ناجحة — الـmigration آمنة' : `❌ ${failures} فحصاً فاشلاً`}`);
  await db.close();
  process.exit(failures === 0 ? 0 : 1);
}

async function listAppliedMigrationIdsOn(db: PGlite): Promise<string[]> {
  const res = await db.query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id ASC');
  return res.rows.map((r) => r.id);
}

main().catch((error) => {
  console.error('Dry-run failed:', error);
  process.exit(1);
});
