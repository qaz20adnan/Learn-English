import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  getBestStoryScore,
  getStoryBySlug,
  listStories,
  listStoryQuestions,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { StoryQuiz, type QuizQuestion } from '@/components/stories/StoryQuiz';
import { LevelBadge, SectionTitle } from '@/components/ui';

export async function generateMetadata(
  props: PageProps<'/stories/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const story = await getStoryBySlug(slug);
  return { title: story ? (story.titleAr ?? story.title) : dict.stories.notFound };
}

export default async function StoryPage(props: PageProps<'/stories/[slug]'>) {
  const user = await requireUser();
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const story = await getStoryBySlug(slug);
  if (!story || !story.isPublished) notFound();

  const [questions, best, stories] = await Promise.all([
    listStoryQuestions(story.id),
    getBestStoryScore(user.id, story.id),
    listStories(),
  ]);
  const quiz: QuizQuestion[] = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }));
  const paragraphs = story.body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const words = story.body.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(words / 180));
  const storyIndex = stories.findIndex((item) => item.id === story.id);
  const nextStory =
    storyIndex >= 0 && storyIndex < stories.length - 1 ? stories[storyIndex + 1] : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/stories" className="text-sm font-semibold text-muted hover:text-brand-600">
        ← {dict.stories.allStories}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {story.coverEmoji}
          </span>
          <h1 className="text-2xl font-black tracking-tight">{story.titleAr ?? story.title}</h1>
          <LevelBadge level={story.level} label={dict.levels[story.level]} />
        </div>
        <p dir="ltr" className="force-ltr text-sm text-muted">
          {story.title}
        </p>
        <p className="text-sm text-muted">{story.summary}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span>{dict.stories.readingTime(readingMinutes)}</span>
          <span aria-hidden>·</span>
          <span>{dict.stories.wordCount(words)}</span>
          <span aria-hidden>·</span>
          <span>{dict.stories.questions(questions.length)}</span>
        </div>
      </header>

      <article dir="ltr" className="card force-ltr prose-lesson p-6 text-left">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      <section className="flex flex-col gap-4">
        <SectionTitle title={dict.stories.quizTitle} description={dict.stories.quizDescription} />
        {/* عقد الـ API: getStoryBySlug(parsed.data.storyId) — يجب إرسال الـ slug لا المعرف الداخلي */}
        <StoryQuiz storyId={story.slug} questions={quiz} bestScore={best} />
      </section>

      {nextStory ? (
        <Link
          href={`/stories/${nextStory.slug}`}
          className="card flex items-center justify-between gap-3 p-5 transition hover:border-brand-400"
        >
          <span className="text-sm font-bold">{nextStory.coverEmoji} {nextStory.titleAr ?? nextStory.title}</span>
          <span className="text-sm font-bold text-brand-600 dark:text-brand-300">
            {dict.stories.nextStory}
          </span>
        </Link>
      ) : null}
    </div>
  );
}
