/**
 * Idempotently adds or refreshes the graded story library.
 *
 * Unlike `db:seed`, this script never resets courses, lessons, vocabulary or
 * learner attempts. It upserts stories by slug, replaces only their
 * comprehension questions, and leaves story attempt history intact.
 *
 * Usage: npm run db:stories
 */
import { newId, nowIso, one, run } from '../src/lib/db/client';
import { STORY_LIBRARY } from '../src/lib/content/story-library';

const ts = nowIso();

async function main(): Promise<void> {
  const maxRow = await one<{ max_position: number }>(
    'SELECT COALESCE(MAX(position), -1)::int AS max_position FROM stories',
  );
  let nextPosition = (maxRow?.max_position ?? -1) + 1;
  let created = 0;
  let updated = 0;

  for (const story of STORY_LIBRARY) {
    const existing = await one<{ id: string }>('SELECT id FROM stories WHERE slug = ?', story.slug);
    let storyId = existing?.id;

    if (storyId) {
      await run(
        `UPDATE stories SET
           title = ?, title_ar = ?, level = ?, cover_emoji = ?, summary = ?, body = ?,
           is_published = 1, updated_at = ?
         WHERE id = ?`,
        story.title,
        story.titleAr,
        story.level,
        story.coverEmoji,
        story.summary,
        story.body,
        ts,
        storyId,
      );
      updated += 1;
    } else {
      storyId = newId('sty');
      await run(
        `INSERT INTO stories
           (id, slug, title, title_ar, level, cover_emoji, summary, body, is_published, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        storyId,
        story.slug,
        story.title,
        story.titleAr,
        story.level,
        story.coverEmoji,
        story.summary,
        story.body,
        nextPosition,
        ts,
        ts,
      );
      nextPosition += 1;
      created += 1;
    }

    await run('DELETE FROM story_questions WHERE story_id = ?', storyId);
    for (const [index, question] of story.questions.entries()) {
      await run(
        `INSERT INTO story_questions
           (id, story_id, prompt, options, answer_index, explanation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        newId('qst'),
        storyId,
        question.prompt,
        JSON.stringify(question.options),
        question.answerIndex,
        question.explanation,
        index,
      );
    }
  }

  const counts = await one<Record<string, number>>(
    `SELECT
       (SELECT COUNT(*)::int FROM stories) AS stories,
       (SELECT COUNT(*)::int FROM story_questions) AS questions`,
  );
  console.log(`Stories synced: ${created} created, ${updated} refreshed.`);
  console.log('Totals:', counts);
}

main().catch((error) => {
  console.error('Story sync failed:', error);
  process.exit(1);
});
