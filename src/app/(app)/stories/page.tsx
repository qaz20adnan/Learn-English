import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { getBestStoryScore, listStories } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Card, LevelBadge, SectionTitle } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.stories.metaTitle };
}

export default async function StoriesPage() {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const stories = listStories();

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={dict.stories.title} description={dict.stories.description} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => {
          const best = getBestStoryScore(user.id, story.id);
          return (
            <Card key={story.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden>
                  {story.coverEmoji}
                </span>
                <LevelBadge level={story.level} label={dict.levels[story.level]} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{story.titleAr ?? story.title}</h2>
                <p dir="ltr" className="force-ltr text-xs text-muted">
                  {story.title}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted">{story.summary}</p>
              <div className="mt-auto flex items-center justify-between text-xs text-muted">
                <span>{dict.stories.questions(story.questionCount ?? 0)}</span>
                {best !== null ? (
                  <span>{dict.stories.bestScore(best)}</span>
                ) : (
                  <span>{dict.stories.notTested}</span>
                )}
              </div>
              <Link
                href={`/stories/${story.slug}`}
                className="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-brand-700"
              >
                {dict.stories.read}
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
