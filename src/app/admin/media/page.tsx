import { requireAdmin } from '@/lib/auth/dal';
import { listMedia } from '@/lib/db/queries';
import { PROVIDER_LABELS } from '@/lib/media';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { MediaStatusBadge } from '@/components/media/MediaStatusBadge';
import { Card, SectionTitle } from '@/components/ui';
import { verifyAllMediaAction, verifyMediaAction } from '../actions';

export default async function AdminMediaPage() {
  await requireAdmin();
  const { locale, dict } = await getLocaleAndDictionary();
  const media = await listMedia();
  const t = dict.admin.mediaPage;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title={t.title}
        description={t.description}
        action={
          <form action={verifyAllMediaAction}>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              🔎 {t.verifyAll}
            </button>
          </form>
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.colTitle}</th>
              <th className="px-4 py-3 text-start">{t.colType}</th>
              <th className="px-4 py-3 text-start">{t.colStatus}</th>
              <th className="px-4 py-3 text-start">{t.colNote}</th>
              <th className="px-4 py-3 text-start">{t.colCheckedAt}</th>
              <th className="px-4 py-3 text-start">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {media.map((item) => (
              <tr key={item.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{item.title ?? '—'}</div>
                  {item.url ? (
                    <a
                      dir="ltr"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="force-ltr block max-w-[20rem] truncate text-xs text-brand-600 hover:underline dark:text-brand-300"
                    >
                      {item.url}
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3">{PROVIDER_LABELS[item.provider]}</td>
                <td className="px-4 py-3">
                  <MediaStatusBadge
                    status={item.verificationStatus}
                    note={item.verificationNote}
                    label={dict.media.verification[item.verificationStatus]}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-muted">{item.verificationNote ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {item.lastCheckedAt
                    ? new Date(item.lastCheckedAt).toLocaleString(locale)
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <form action={verifyMediaAction}>
                    <input type="hidden" name="mediaId" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold transition hover:border-brand-400"
                    >
                      {t.verify}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted">{t.disclaimer}</p>
    </div>
  );
}
