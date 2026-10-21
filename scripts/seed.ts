/**
 * Seeds the database with demo courses, lessons, media, vocabulary and stories.
 *
 * Content tables are replaced on every run; user accounts are never touched.
 * An initial admin is created only when ADMIN_EMAIL and ADMIN_PASSWORD are set,
 * so no default credentials ever ship with the project.
 *
 * Usage: npm run db:seed
 */
import { getDb, newId, nowIso } from '../src/lib/db/client';
import { hashPassword } from '../src/lib/auth/password';
import { parseMediaUrl } from '../src/lib/media';
import { SEED_COURSES, SEED_MEDIA, SEED_QUIZZES, SEED_STORIES } from '../src/lib/content/seed-data';

const db = getDb();
const ts = nowIso();

function resetContent(): void {
  db.exec(`
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

function seedMedia(): Map<string, string> {
  const insert = db.prepare(
    `INSERT INTO media (id, provider, external_id, url, title, verification_status, verification_note, source_url, last_checked_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'UNVERIFIED', NULL, ?, NULL, ?, ?)`,
  );
  const map = new Map<string, string>();
  for (const item of SEED_MEDIA) {
    const parsed = parseMediaUrl(item.url);
    const id = newId('med');
    insert.run(
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

function seedCourses(mediaIds: Map<string, string>): SeededIds {
  const insertCourse = db.prepare(
    `INSERT INTO courses (id, slug, title, title_ar, description, level, category, cover_emoji, accent, is_published, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  );
  const insertLesson = db.prepare(
    `INSERT INTO lessons (id, course_id, slug, title, title_ar, summary, content, transcript, duration_minutes, position, media_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertVocab = db.prepare(
    `INSERT INTO vocabulary (id, course_id, term, translation, part_of_speech, phonetic, example, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const linkVocab = db.prepare(
    'INSERT OR IGNORE INTO lesson_vocabulary (lesson_id, vocab_id, position) VALUES (?, ?, ?)',
  );

  const courseIds = new Map<string, string>();
  const lessonIds = new Map<string, string>();

  SEED_COURSES.forEach((course, courseIndex) => {
    const courseId = newId('crs');
    courseIds.set(course.slug, courseId);
    insertCourse.run(
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
    course.lessons.forEach((lesson, lessonIndex) => {
      const lessonId = newId('les');
      lessonIds.set(`${course.slug}/${lesson.slug}`, lessonId);
      courseLessonIds.push(lessonId);
      insertLesson.run(
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
    });

    const courseVocabIds: string[] = [];
    for (const vocab of course.vocabulary) {
      const vocabId = newId('voc');
      courseVocabIds.push(vocabId);
      insertVocab.run(
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
    courseLessonIds.forEach((lessonId) => {
      courseVocabIds.forEach((vocabId, position) => {
        linkVocab.run(lessonId, vocabId, position);
      });
    });
  });

  return { courseIds, lessonIds };
}

function seedStories(): void {
  const insertStory = db.prepare(
    `INSERT INTO stories (id, slug, title, title_ar, level, cover_emoji, summary, body, is_published, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  );
  const insertQuestion = db.prepare(
    `INSERT INTO story_questions (id, story_id, prompt, options, answer_index, explanation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  SEED_STORIES.forEach((story, index) => {
    const storyId = newId('sty');
    insertStory.run(
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
    story.questions.forEach((question, qIndex) => {
      insertQuestion.run(
        newId('qst'),
        storyId,
        question.prompt,
        JSON.stringify(question.options),
        question.answerIndex,
        question.explanation,
        qIndex,
      );
    });
  });
}

function seedQuizzes(ids: SeededIds): void {
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (id, slug, title, title_ar, description, level, course_id, lesson_id, is_published, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  );
  const insertQuestion = db.prepare(
    `INSERT INTO quiz_questions (id, quiz_id, type, prompt, options, answer_index, accepted_answers, correct_boolean, points, explanation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  SEED_QUIZZES.forEach((quiz, index) => {
    const quizId = newId('qiz');
    const courseId = quiz.courseSlug ? (ids.courseIds.get(quiz.courseSlug) ?? null) : null;
    const lessonId =
      quiz.courseSlug && quiz.lessonSlug
        ? (ids.lessonIds.get(`${quiz.courseSlug}/${quiz.lessonSlug}`) ?? null)
        : null;
    insertQuiz.run(
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
    quiz.questions.forEach((question, qIndex) => {
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
        qIndex,
      );
    });
  });
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

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
    | { id: string }
    | undefined;
  if (existing) {
    db.prepare("UPDATE users SET role = 'ADMIN', updated_at = ? WHERE id = ?").run(ts, existing.id);
    console.log(`ℹ️  Existing user ${email} promoted to ADMIN.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)`,
  ).run(newId('usr'), email, name, passwordHash, ts, ts);
  db.prepare(
    `INSERT INTO user_settings (user_id, daily_goal_minutes, theme, ui_language, updated_at)
     VALUES ((SELECT id FROM users WHERE email = ?), 15, 'system', 'ar', ?)`,
  ).run(email, ts);
  console.log(`✅ Admin user ${email} created.`);
}

async function main(): Promise<void> {
  console.log('Seeding content...');
  resetContent();
  const mediaIds = seedMedia();
  const ids = seedCourses(mediaIds);
  seedStories();
  seedQuizzes(ids);
  await seedAdmin();

  const counts = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM lessons) AS lessons,
        (SELECT COUNT(*) FROM media) AS media,
        (SELECT COUNT(*) FROM vocabulary) AS vocabulary,
        (SELECT COUNT(*) FROM stories) AS stories,
        (SELECT COUNT(*) FROM story_questions) AS questions,
        (SELECT COUNT(*) FROM quizzes) AS quizzes,
        (SELECT COUNT(*) FROM quiz_questions) AS quiz_questions`,
    )
    .get() as Record<string, number>;

  console.log('Seed complete:', counts);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
