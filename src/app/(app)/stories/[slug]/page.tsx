import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getBestStoryScore, getStoryBySlug, listStoryQuestions } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { StoryQuiz, type QuizQuestion } from '@/components/stories/StoryQuiz';
import { LevelBadge, SectionTitle } from '@/components/ui';

export async function generateMetadata(
  props: PageProps<'/stories/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const story = getStoryBySlug(slug);
  return { title: story ? (story.titleAr ?? story.title) : dict.stories.notFound };
}

export default async function StoryPage(props: PageProps<'/stories/[slug]'>) {
  const user = await requireUser();
  const { slug } = await props.params;
  const { dict } = await getLocaleAndDictionary();
  const story = getStoryBySlug(slug);
  if (!story || !story.isPublished) notFound();

  const questions = listStoryQuestions(story.id);
  const quiz: QuizQuestion[] = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }));
  const best = getBestStoryScore(user.id, story.id);
  const paragraphs = story.body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

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
      </header>

      <article dir="ltr" className="card force-ltr prose-lesson p-6 text-left">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      <section className="flex flex-col gap-4">
        <SectionTitle title={dict.stories.quizTitle} description={dict.stories.quizDescription} />
        <StoryQuiz storyId={story.id} questions={quiz} bestScore={best} />
      </section>
    </div>
  );
}
