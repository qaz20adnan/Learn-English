/**
 * Synchronises the zAmerican English curriculum into the database.
 *
 * For every course in `src/lib/content/catalog.ts` it:
 *   1. fetches the real playlist videos from YouTube (cached in `youtube_cache`),
 *   2. creates/updates the course, its lessons and the YouTube media rows,
 *   3. attaches generated vocabulary + a revision quiz to each lesson,
 *   4. removes lessons that are no longer part of the playlist.
 *
 * The command is idempotent: re-running it will not duplicate rows and will not
 * wipe existing learner progress. Pass `--refresh` to re-fetch playlists from
 * the network, and `--refresh-content` to regenerate vocabulary and quizzes.
 *
 * Usage: npm run db:sync [-- --refresh --refresh-content]
 */
import { getDb, newId, nowIso } from '../src/lib/db/client';
import { CATALOG_COURSES } from '../src/lib/content/catalog';
import { fetchPlaylistItems, type YouTubeItem } from '../src/lib/youtube';
import { generateQuizQuestions, generateVocabulary } from '../src/lib/content/generate';
import type { Level } from '../src/lib/types';

const db = getDb();
const ts = nowIso();
const REFRESH = process.argv.includes('--refresh');
const REFRESH_CONTENT = process.argv.includes('--refresh-content');

function upsertCourse(
  course: (typeof CATALOG_COURSES)[number],
  position: number,
): string {
  const existing = db.prepare('SELECT id FROM courses WHERE slug = ?').get(course.slug) as
    | { id: string }
    | undefined;

  if (existing) {
    db.prepare(
      `UPDATE courses SET
         title = ?, title_ar = ?, description = ?, level = ?, level_group = ?,
         category = ?, cover_emoji = ?, accent = ?, playlist_id = ?, is_published = 1,
         position = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      course.title,
      course.titleAr,
      course.description,
      course.level,
      course.levelGroup,
      course.category,
      course.coverEmoji,
      course.accent,
      course.playlistId,
      position,
      ts,
      existing.id,
    );
    return existing.id;
  }

  const id = newId('crs');
  db.prepare(
    `INSERT INTO courses
       (id, slug, title, title_ar, description, level, level_group, category, cover_emoji, accent, playlist_id, is_published, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  ).run(
    id,
    course.slug,
    course.title,
    course.titleAr,
    course.description,
    course.level,
    course.levelGroup,
    course.category,
    course.coverEmoji,
    course.accent,
    course.playlistId,
    position,
    ts,
    ts,
  );
  return id;
}

function upsertMedia(item: YouTubeItem): string {
  const url = `https://www.youtube.com/watch?v=${item.videoId}`;
  const existing = db
    .prepare("SELECT id FROM media WHERE provider = 'YOUTUBE' AND external_id = ?")
    .get(item.videoId) as { id: string } | undefined;

  if (existing) {
    db.prepare('UPDATE media SET url = ?, title = ?, updated_at = ? WHERE id = ?').run(
      url,
      item.title,
      ts,
      existing.id,
    );
    return existing.id;
  }

  const id = newId('med');
  db.prepare(
    `INSERT INTO media
       (id, provider, external_id, url, title, verification_status, verification_note, last_checked_at, created_at, updated_at)
     VALUES (?, 'YOUTUBE', ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?)`,
  ).run(
    id,
    item.videoId,
    url,
    item.title,
    'Imported from the zAmerican English channel playlist.',
    ts,
    ts,
    ts,
  );
  return id;
}

function upsertLesson(courseId: string, item: YouTubeItem, position: number, mediaId: string): string {
  const slug = `v-${item.videoId}`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
  const durationMinutes = item.durationSeconds ? Math.max(1, Math.round(item.durationSeconds / 60)) : 5;
  const summary = item.title;
  const content = `## ${item.title}\n\nدرس من قناة zAmerican English.\n\n[شاهد الدرس على يوتيوب](${youtubeUrl})`;

  const existing = db
    .prepare('SELECT id FROM lessons WHERE course_id = ? AND slug = ?')
    .get(courseId, slug) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE lessons SET
         title = ?, summary = ?, content = ?, duration_minutes = ?, position = ?, media_id = ?, updated_at = ?
       WHERE id = ?`,
    ).run(item.title, summary, content, durationMinutes, position, mediaId, ts, existing.id);
    return existing.id;
  }

  const id = newId('les');
  db.prepare(
    `INSERT INTO lessons
       (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, media_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)`,
  ).run(id, courseId, slug, item.title, summary, content, durationMinutes, position, mediaId, ts, ts);
  return id;
}

function lessonHasGeneratedVocabulary(lessonId: string): boolean {
  const row = db
    .prepare('SELECT COUNT(*) AS c FROM lesson_vocabulary WHERE lesson_id = ?')
    .get(lessonId) as { c: number };
  return row.c > 0;
}

/** Inserts a shared word once (case-insensitive) and returns its id. */
function upsertSharedWord(word: { term: string; translation: string; partOfSpeech?: string; phonetic?: string; example?: string }): string {
  const existing = db
    .prepare('SELECT id FROM vocabulary WHERE created_by IS NULL AND term = ? COLLATE NOCASE')
    .get(word.term) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = newId('voc');
  db.prepare(
    `INSERT INTO vocabulary (id, course_id, lesson_id, term, translation, part_of_speech, phonetic, example, created_by, created_at)
     VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, NULL, ?)`,
  ).run(
    id,
    word.term,
    word.translation,
    word.partOfSpeech ?? 'noun',
    word.phonetic ?? null,
    word.example ?? '',
    ts,
  );
  return id;
}

function generateLessonVocabulary(lessonId: string, level: Level, slug: string): void {
  if (!REFRESH_CONTENT && lessonHasGeneratedVocabulary(lessonId)) return;

  const words = generateVocabulary(level, slug);
  const link = db.prepare(
    'INSERT OR IGNORE INTO lesson_vocabulary (lesson_id, vocab_id, position) VALUES (?, ?, ?)',
  );
  db.prepare('DELETE FROM lesson_vocabulary WHERE lesson_id = ?').run(lessonId);
  words.forEach((word, position) => {
    const vocabId = upsertSharedWord(word);
    link.run(lessonId, vocabId, position);
  });
}

function generateLessonQuiz(
  courseId: string,
  courseSlug: string,
  lessonId: string,
  level: Level,
  lessonSlug: string,
  lessonTitle: string,
): void {
  const existing = db.prepare('SELECT id FROM quizzes WHERE lesson_id = ?').get(lessonId) as
    | { id: string }
    | undefined;

  if (existing && !REFRESH_CONTENT) return;

  const quizId = existing?.id ?? newId('qiz');
  if (existing) {
    db.prepare('DELETE FROM quiz_questions WHERE quiz_id = ?').run(quizId);
    db.prepare('UPDATE quizzes SET title = ?, title_ar = ?, updated_at = ? WHERE id = ?').run(
      `${lessonTitle} — Quiz`,
      `${lessonTitle} — اختبار`,
      ts,
      quizId,
    );
  } else {
    db.prepare(
      `INSERT INTO quizzes (id, slug, title, title_ar, description, level, course_id, lesson_id, is_published, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
    ).run(
      quizId,
      `${courseSlug}-${lessonSlug}-quiz`,
      `${lessonTitle} — Quiz`,
      `${lessonTitle} — اختبار`,
      'اختبار قصير على أهم قواعد ومفردات الدرس.',
      level,
      courseId,
      lessonId,
      ts,
      ts,
    );
  }

  const insertQuestion = db.prepare(
    `INSERT INTO quiz_questions
       (id, quiz_id, type, prompt, options, answer_index, accepted_answers, correct_boolean, points, explanation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  generateQuizQuestions(level, lessonSlug).forEach((question, index) => {
    insertQuestion.run(
      newId('qq'),
      quizId,
      question.type,
      question.prompt,
      JSON.stringify(question.options ?? []),
      question.answerIndex ?? null,
      JSON.stringify(question.acceptedAnswers ?? []),
      question.correctBoolean === undefined ? null : question.correctBoolean ? 1 : 0,
      question.points ?? 1,
      question.explanation ?? '',
      index,
    );
  });
}

async function main(): Promise<void> {
  const summary: { course: string; lessons: number; status: string }[] = [];

  for (let index = 0; index < CATALOG_COURSES.length; index += 1) {
    const course = CATALOG_COURSES[index];
    const courseId = upsertCourse(course, index);

    let items: YouTubeItem[] = [];
    try {
      items = await fetchPlaylistItems(course.playlistId, { force: REFRESH });
    } catch (error) {
      console.error(`  ! ${course.slug}: ${(error as Error).message}`);
      summary.push({ course: course.slug, lessons: 0, status: 'fetch failed' });
      continue;
    }

    const seenLessonIds = new Set<string>();
    items.forEach((item, position) => {
      const mediaId = upsertMedia(item);
      const lessonId = upsertLesson(courseId, item, position, mediaId);
      seenLessonIds.add(lessonId);
      generateLessonVocabulary(lessonId, course.level, `v-${item.videoId}`);
      generateLessonQuiz(courseId, course.slug, lessonId, course.level, `v-${item.videoId}`, item.title);
    });

    // Drop lessons that were removed from the playlist.
    const existingLessons = db
      .prepare('SELECT id FROM lessons WHERE course_id = ?')
      .all(courseId) as unknown as { id: string }[];
    const remove = db.prepare('DELETE FROM lessons WHERE id = ?');
    for (const lesson of existingLessons) {
      if (!seenLessonIds.has(lesson.id)) remove.run(lesson.id);
    }

    summary.push({ course: course.slug, lessons: items.length, status: 'ok' });
    console.log(`  · ${course.slug}: ${items.length} lessons`);
  }

  const row = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM lessons) AS lessons,
        (SELECT COUNT(*) FROM media) AS media,
        (SELECT COUNT(*) FROM vocabulary) AS vocabulary,
        (SELECT COUNT(*) FROM quizzes) AS quizzes,
        (SELECT COUNT(*) FROM quiz_questions) AS quiz_questions`,
    )
    .get() as Record<string, number>;

  console.log('\nSync complete:', row);
  console.log('Courses processed:', summary.length);
}

main().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
