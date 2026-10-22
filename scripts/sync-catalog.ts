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
import { all, newId, nowIso, one, run } from '../src/lib/db/client';
import { CATALOG_COURSES } from '../src/lib/content/catalog';
import { fetchPlaylistItems, type YouTubeItem } from '../src/lib/youtube';
import { generateQuizQuestions, generateVocabulary } from '../src/lib/content/generate';
import type { Level } from '../src/lib/types';

const ts = nowIso();
const REFRESH = process.argv.includes('--refresh');
const REFRESH_CONTENT = process.argv.includes('--refresh-content');

async function upsertCourse(
  course: (typeof CATALOG_COURSES)[number],
  position: number,
): Promise<string> {
  const existing = await one<{ id: string }>('SELECT id FROM courses WHERE slug = ?', course.slug);

  if (existing) {
    await run(
      `UPDATE courses SET
         title = ?, title_ar = ?, description = ?, level = ?, level_group = ?,
         category = ?, cover_emoji = ?, accent = ?, playlist_id = ?, is_published = 1,
         position = ?, updated_at = ?
       WHERE id = ?`,
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
  await run(
    `INSERT INTO courses
       (id, slug, title, title_ar, description, level, level_group, category, cover_emoji, accent, playlist_id, is_published, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
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

async function upsertMedia(item: YouTubeItem, playlistId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${item.videoId}`;
  const sourceUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const note = 'Imported from the zAmerican English channel playlist.';
  const existing = await one<{ id: string }>(
    "SELECT id FROM media WHERE provider = 'YOUTUBE' AND external_id = ?",
    item.videoId,
  );

  if (existing) {
    await run(
      `UPDATE media SET url = ?, title = ?, source_url = ?, verification_status = 'AVAILABLE',
         verification_note = ?, last_checked_at = ?, updated_at = ?
       WHERE id = ?`,
      url,
      item.title,
      sourceUrl,
      note,
      ts,
      ts,
      existing.id,
    );
    return existing.id;
  }

  const id = newId('med');
  await run(
    `INSERT INTO media
       (id, provider, external_id, url, title, verification_status, verification_note, source_url, last_checked_at, created_at, updated_at)
     VALUES (?, 'YOUTUBE', ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?, ?)`,
    id,
    item.videoId,
    url,
    item.title,
    note,
    sourceUrl,
    ts,
    ts,
    ts,
  );
  return id;
}

async function upsertLesson(
  courseId: string,
  courseTitle: string,
  item: YouTubeItem,
  position: number,
  mediaId: string,
): Promise<string> {
  const slug = `v-${item.videoId}`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
  const durationMinutes = item.durationSeconds
    ? Math.max(1, Math.round(item.durationSeconds / 60))
    : 5;
  const description = item.description?.trim().slice(0, 2_000) ?? '';
  // The YouTube description is stored in the lesson body. Using it as the card
  // summary would surface promotional links, so the title is the clean summary.
  const summary = item.title;
  const descriptionBlock = description
    ? `\n\n### وصف الدرس من القناة\n\n${description}\n`
    : '';
  const durationLine = item.durationSeconds
    ? `\n> مدة الفيديو: ${durationMinutes} دقائق تقريبًا.`
    : '';
  const content = `## ${item.title}

${descriptionBlock}
### ماذا ستتعلّم في هذا الدرس؟

- أهم المفردات والعبارات الواردة في فيديو **${courseTitle}**.
- كيف تستخدم الكلمات الجديدة في جمل يومية.
- تدريب على الاستماع وفهم الفكرة العامة قبل التفاصيل.

### خطوات الدراسة

1. شاهد الفيديو كاملًا مرة واحدة دون توقف.
2. أعِد مشاهدة المقاطع الصعبة مع قراءة المفردات أسفل الصفحة.
3. اكتب جملتين من عندك باستخدام كلمتين جديدتين.
4. اجتز اختبار الدرس بنسبة **70%** على الأقل لفتح الدرس التالي.

> نصيحة: المراجعة القصيرة المتكررة أفضل من مشاهدة طويلة مرة واحدة.${durationLine}

[شاهد الدرس على يوتيوب](${youtubeUrl})`;

  const existing = await one<{ id: string }>(
    'SELECT id FROM lessons WHERE course_id = ? AND slug = ?',
    courseId,
    slug,
  );

  if (existing) {
    await run(
      `UPDATE lessons SET
         title = ?, summary = ?, content = ?, duration_minutes = ?, position = ?, media_id = ?, updated_at = ?
       WHERE id = ?`,
      item.title,
      summary,
      content,
      durationMinutes,
      position,
      mediaId,
      ts,
      existing.id,
    );
    return existing.id;
  }

  const id = newId('les');
  await run(
    `INSERT INTO lessons
       (id, course_id, slug, title, summary, content, transcript, duration_minutes, position, media_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)`,
    id,
    courseId,
    slug,
    item.title,
    summary,
    content,
    durationMinutes,
    position,
    mediaId,
    ts,
    ts,
  );
  return id;
}

async function lessonHasGeneratedVocabulary(lessonId: string): Promise<boolean> {
  const row = await one<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM lesson_vocabulary WHERE lesson_id = ?',
    lessonId,
  );
  return (row?.c ?? 0) > 0;
}

/** Inserts a shared word once (case-insensitive) and returns its id. */
async function upsertSharedWord(word: {
  term: string;
  translation: string;
  partOfSpeech?: string;
  phonetic?: string;
  example?: string;
}): Promise<string> {
  const existing = await one<{ id: string }>(
    'SELECT id FROM vocabulary WHERE created_by IS NULL AND lower(term) = lower(?)',
    word.term,
  );
  if (existing) return existing.id;

  const id = newId('voc');
  await run(
    `INSERT INTO vocabulary (id, course_id, lesson_id, term, translation, part_of_speech, phonetic, example, created_by, created_at)
     VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT DO NOTHING`,
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

async function generateLessonVocabulary(
  lessonId: string,
  level: Level,
  slug: string,
): Promise<void> {
  if (!REFRESH_CONTENT && (await lessonHasGeneratedVocabulary(lessonId))) return;

  const words = generateVocabulary(level, slug);
  await run('DELETE FROM lesson_vocabulary WHERE lesson_id = ?', lessonId);
  for (const [position, word] of words.entries()) {
    const vocabId = await upsertSharedWord(word);
    await run(
      `INSERT INTO lesson_vocabulary (lesson_id, vocab_id, position)
       VALUES (?, ?, ?)
       ON CONFLICT DO NOTHING`,
      lessonId,
      vocabId,
      position,
    );
  }
}

async function generateLessonQuiz(
  courseId: string,
  courseSlug: string,
  lessonId: string,
  level: Level,
  lessonSlug: string,
  lessonTitle: string,
): Promise<void> {
  const existing = await one<{ id: string }>('SELECT id FROM quizzes WHERE lesson_id = ?', lessonId);

  if (existing && !REFRESH_CONTENT) return;

  const quizId = existing?.id ?? newId('qiz');
  const passPercent = 70;
  if (existing) {
    await run('DELETE FROM quiz_questions WHERE quiz_id = ?', quizId);
    await run(
      `UPDATE quizzes SET title = ?, title_ar = ?, description = ?, pass_percent = ?, updated_at = ?
       WHERE id = ?`,
      `${lessonTitle} — Quiz`,
      `${lessonTitle} — اختبار`,
      'اختبار قصير على أهم قواعد ومفردات الدرس. تُسحب الأسئلة عشوائيًا من بنك يتجدد كل محاولة، والنجاح يتطلب 70%.',
      passPercent,
      ts,
      quizId,
    );
  } else {
    await run(
      `INSERT INTO quizzes (id, slug, title, title_ar, description, level, course_id, lesson_id, is_published, position, pass_percent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
      quizId,
      `${courseSlug}-${lessonSlug}-quiz`,
      `${lessonTitle} — Quiz`,
      `${lessonTitle} — اختبار`,
      'اختبار قصير على أهم قواعد ومفردات الدرس. تُسحب الأسئلة عشوائيًا من بنك يتجدد كل محاولة، والنجاح يتطلب 70%.',
      level,
      courseId,
      lessonId,
      passPercent,
      ts,
      ts,
    );
  }

  for (const [index, question] of generateQuizQuestions(level, lessonSlug).entries()) {
    await run(
      `INSERT INTO quiz_questions
         (id, quiz_id, type, prompt, options, answer_index, accepted_answers, correct_boolean, points, explanation, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  }
}

async function main(): Promise<void> {
  const summary: { course: string; lessons: number; status: string }[] = [];

  for (const [index, course] of CATALOG_COURSES.entries()) {
    const courseId = await upsertCourse(course, index);

    let items: YouTubeItem[] = [];
    try {
      items = await fetchPlaylistItems(course.playlistId, { force: REFRESH });
    } catch (error) {
      console.error(`  ! ${course.slug}: ${(error as Error).message}`);
      summary.push({ course: course.slug, lessons: 0, status: 'fetch failed' });
      continue;
    }

    const seenLessonIds = new Set<string>();
    for (const [position, item] of items.entries()) {
      const mediaId = await upsertMedia(item, course.playlistId);
      const lessonId = await upsertLesson(courseId, course.title, item, position, mediaId);
      seenLessonIds.add(lessonId);
      await generateLessonVocabulary(lessonId, course.level, `v-${item.videoId}`);
      await generateLessonQuiz(
        courseId,
        course.slug,
        lessonId,
        course.level,
        `v-${item.videoId}`,
        item.title,
      );
    }

    // Drop lessons that were removed from the playlist.
    const existingLessons = await all<{ id: string }>(
      'SELECT id FROM lessons WHERE course_id = ?',
      courseId,
    );
    for (const lesson of existingLessons) {
      if (!seenLessonIds.has(lesson.id)) {
        await run('DELETE FROM lessons WHERE id = ?', lesson.id);
      }
    }

    summary.push({ course: course.slug, lessons: items.length, status: 'ok' });
    console.log(`  · ${course.slug}: ${items.length} lessons`);
  }

  const counts = await one<Record<string, number>>(
    `SELECT
      (SELECT COUNT(*)::int FROM courses) AS courses,
      (SELECT COUNT(*)::int FROM lessons) AS lessons,
      (SELECT COUNT(*)::int FROM media) AS media,
      (SELECT COUNT(*)::int FROM vocabulary) AS vocabulary,
      (SELECT COUNT(*)::int FROM quizzes) AS quizzes,
      (SELECT COUNT(*)::int FROM quiz_questions) AS quiz_questions`,
  );

  console.log('\nSync complete:', counts);
  console.log('Courses processed:', summary.length);
}

main().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
