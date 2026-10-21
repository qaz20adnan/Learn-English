/**
 * Seeds the database with demo courses, lessons, media, vocabulary and stories.
 *
 * Content tables are replaced on every run; user accounts are never touched.
 * An initial admin is created only when ADMIN_EMAIL and ADMIN_PASSWORD are set,
 * so no default credentials ever ship with the project.
 *
 * Usage: npm run db:seed
 */
import { exec, newId, nowIso, one, run } from '../src/lib/db/client';
import { hashPassword } from '../src/lib/auth/password';
import { parseMediaUrl } from '../src/lib/media';
import { SEED_COURSES, SEED_MEDIA, SEED_QUIZZES, SEED_STORIES } from '../src/lib/content/seed-data';

const ts = nowIso();

async function resetContent(): Promise<void> {
  await exec(`
    DELETE FROM quiz_attempts;
    DELETE FROM quiz_questions;
    DELETE FROM quizzes;
    DELETE FROM story_attempts;
    DELETE FROM story_questions;
    DELETE FROM stories;
    DELETE FROM vocab_favorites;
    DELETE FROM vocab_review;
    DELETE FROM vocabulary;
    DELETE FROM lesson_progress;
    DELETE FROM lessons;
    DELETE FROM media;
    DELETE FROM courses;
  `);
}

async function seedMedia(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const item of SEED_MEDIA) {
    const parsed = parseMediaUrl(item.url);
    const id = newId('med');
    await run(
      `INSERT INTO media (id, provider, external_id, url, title, verification_status, verification_note, source_url, last_checked_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'UNVERIFIED', NULL, ?, NULL, ?, ?)`,
      id,
      parsed.provider,
      parsed.externalId,
      item.url,
      item.title,
      parsed.canonicalUrl ?? item.url,
      ts,
      ts,
    );
    map.set(item.key, id);
  }
  return map;
}

interface SeededIds {
  courseIds: Map<string, string>;
  lessonIds: Map<string, string>;
}

async function seedCourses(mediaIds: Map<string, string>): Promise<SeededIds> {
  const courseIds = new Map<string, string>();
  const lessonIds = new Map<string, string>();

  for (const [courseIndex, course] of SEED_COURSES.entries()) {
    const courseId = newId('crs');
    courseIds.set(course.slug, courseId);
    await run(
      `INSERT INTO courses (id, slug, title, title_ar, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      courseId,
      course.slug,
      course.title,
      course.titleAr,
      course.description,
      course.level,
      course.category,
      course.coverEmoji,
      course.accent,
      courseIndex,
      ts,
      ts,
    );

    const courseLessonIds: string[] = [];
    for (const [lessonIndex, lesson] of course.lessons.entries()) {
      const lessonId = newId('les');
      lessonIds.set(`${course.slug}/${lesson.slug}`, lessonId);
      courseLessonIds.push(lessonId);
      await run(
        `INSERT INTO lessons (id, course_id, slug, title, title_ar, summary, content, transcript, duration_minutes, position, media_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        lessonId,
        courseId,
        lesson.slug,
        lesson.title,
        lesson.titleAr ?? null,
        lesson.summary,
        lesson.content,
        lesson.transcript ?? '',
        lesson.durationMinutes,
        lessonIndex,
        lesson.mediaKey ? (mediaIds.get(lesson.mediaKey) ?? null) : null,
        ts,
        ts,
      );
    }

    const courseVocabIds: string[] = [];
    for (const vocab of course.vocabulary) {
      const vocabId = newId('voc');
      courseVocabIds.push(vocabId);
      await run(
        `INSERT INTO vocabulary (id, course_id, term, translation, part_of_speech, phonetic, example, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        vocabId,
        courseId,
        vocab.term,
        vocab.translation,
        vocab.partOfSpeech ?? 'noun',
        vocab.phonetic ?? null,
        vocab.example ?? '',
        ts,
      );
    }

    // Attach every course word to each of the course lessons so the lesson page
    // always has vocabulary to show.
    for (const lessonId of courseLessonIds) {
      for (const [position, vocabId] of courseVocabIds.entries()) {
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
  }

  return { courseIds, lessonIds };
}

async function seedStories(): Promise<void> {
  for (const [index, story] of SEED_STORIES.entries()) {
    const storyId = newId('sty');
    await run(
      `INSERT INTO stories (id, slug, title, title_ar, level, cover_emoji, summary, body, is_published, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      storyId,
      story.slug,
      story.title,
      story.titleAr,
      story.level,
      story.coverEmoji,
      story.summary,
      story.body,
      index,
      ts,
      ts,
    );
    for (const [qIndex, question] of story.questions.entries()) {
      await run(
        `INSERT INTO story_questions (id, story_id, prompt, options, answer_index, explanation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        newId('qst'),
        storyId,
        question.prompt,
        JSON.stringify(question.options),
        question.answerIndex,
        question.explanation,
        qIndex,
      );
    }
  }
}

async function seedQuizzes(ids: SeededIds): Promise<void> {
  for (const [index, quiz] of SEED_QUIZZES.entries()) {
    const quizId = newId('qiz');
    const courseId = quiz.courseSlug ? (ids.courseIds.get(quiz.courseSlug) ?? null) : null;
    const lessonId =
      quiz.courseSlug && quiz.lessonSlug
        ? (ids.lessonIds.get(`${quiz.courseSlug}/${quiz.lessonSlug}`) ?? null)
        : null;
    await run(
      `INSERT INTO quizzes (id, slug, title, title_ar, description, level, course_id, lesson_id, is_published, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      quizId,
      quiz.slug,
      quiz.title,
      quiz.titleAr,
      quiz.description,
      quiz.level,
      courseId,
      lessonId,
      index,
      ts,
      ts,
    );
    for (const [qIndex, question] of quiz.questions.entries()) {
      await run(
        `INSERT INTO quiz_questions (id, quiz_id, type, prompt, options, answer_index, accepted_answers, correct_boolean, points, explanation, position)
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
        qIndex,
      );
    }
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Academy Admin';

  if (!email || !password) {
    console.log('ℹ️  Skipping admin user. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
    return;
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const existing = await one<{ id: string }>('SELECT id FROM users WHERE email = ?', email);
  if (existing) {
    await run("UPDATE users SET role = 'ADMIN', updated_at = ? WHERE id = ?", ts, existing.id);
    console.log(`ℹ️  Existing user ${email} promoted to ADMIN.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const userId = newId('usr');
  await run(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)`,
    userId,
    email,
    name,
    passwordHash,
    ts,
    ts,
  );
  await run(
    `INSERT INTO user_settings (user_id, daily_goal_minutes, theme, ui_language, updated_at)
     VALUES (?, 15, 'system', 'ar', ?)
     ON CONFLICT (user_id) DO NOTHING`,
    userId,
    ts,
  );
  console.log(`✅ Admin user ${email} created.`);
}

async function main(): Promise<void> {
  console.log('Seeding content...');
  await resetContent();
  const mediaIds = await seedMedia();
  const ids = await seedCourses(mediaIds);
  await seedStories();
  await seedQuizzes(ids);
  await seedAdmin();

  const counts = await one<Record<string, number>>(
    `SELECT
      (SELECT COUNT(*)::int FROM courses) AS courses,
      (SELECT COUNT(*)::int FROM lessons) AS lessons,
      (SELECT COUNT(*)::int FROM media) AS media,
      (SELECT COUNT(*)::int FROM vocabulary) AS vocabulary,
      (SELECT COUNT(*)::int FROM stories) AS stories,
      (SELECT COUNT(*)::int FROM story_questions) AS questions,
      (SELECT COUNT(*)::int FROM quizzes) AS quizzes,
      (SELECT COUNT(*)::int FROM quiz_questions) AS quiz_questions`,
  );

  console.log('Seed complete:', counts);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
