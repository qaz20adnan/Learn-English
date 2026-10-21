import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { countUsers, listCourses, listMedia, listStories } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { SectionTitle, StatCard } from '@/components/ui';

export default async function AdminOverviewPage() {
  await requireAdmin();
  const { dict } = await getLocaleAndDictionary();
  const users = countUsers();
  const courses = listCourses(true);
  const media = listMedia();
  const stories = listStories();

  const mediaByStatus = media.reduce<Record<string, number>>((acc, item) => {
    acc[item.verificationStatus] = (acc[item.verificationStatus] ?? 0) + 1;
    return acc;
  }, {});

  const t = dict.admin.overviewPage;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t.title} description={t.description} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard emoji="👥" label={t.users} value={users} />
        <StatCard emoji="📚" label={t.courses} value={courses.length} />
        <StatCard emoji="📖" label={t.stories} value={stories.length} />
        <StatCard emoji="🎬" label={t.media} value={media.length} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card flex flex-col gap-3 p-5">
          <h3 className="font-bold">{t.mediaStatus}</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between">
              <span>{dict.media.verification.AVAILABLE}</span>
              <span className="font-bold text-emerald-600">{mediaByStatus.AVAILABLE ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{dict.media.verification.UNAVAILABLE}</span>
              <span className="font-bold text-rose-600">{mediaByStatus.UNAVAILABLE ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{dict.media.verification.NEEDS_REVIEW}</span>
              <span className="font-bold text-amber-600">{mediaByStatus.NEEDS_REVIEW ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{dict.media.verification.UNVERIFIED}</span>
              <span className="font-bold text-muted">{mediaByStatus.UNVERIFIED ?? 0}</span>
            </li>
          </ul>
          <Link
            href="/admin/media"
            className="mt-1 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            {t.manageMedia} ←
          </Link>
        </div>

        <div className="card flex flex-col gap-3 p-5">
          <h3 className="font-bold">{t.operations}</h3>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-sm text-muted">
            <li>{t.noteSetup}</li>
            <li>{t.noteAdmin}</li>
            <li>{t.noteVerify}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
