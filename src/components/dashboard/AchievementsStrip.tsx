import type { AchievementView } from '@/lib/achievements';
import type { Dictionary } from '@/lib/i18n';

/**
 * Dashboard element #8 — achievements strip, starter set (Sprint 5, 3.1).
 *
 * Every badge is rendered from a real computed metric (see
 * `src/lib/achievements.ts`): unlocked badges lead, locked ones show honest
 * progress toward their target. Pure server component.
 */
export function AchievementsStrip({
  items,
  unlockedCount,
  dict,
}: {
  items: AchievementView[];
  unlockedCount: number;
  dict: Dictionary;
}) {
  const t = dict.dashboard;
  const totalCount = items.length;

  return (
    <section aria-label={t.achievementsTitle} className="flex flex-col gap-3">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{t.achievementsTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.achievementsSub}</p>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
          {t.achievementsUnlockedOf(unlockedCount, totalCount)}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => {
          const meta = t.achievements.items[item.id as keyof typeof t.achievements.items];
          return (
            <li
              key={item.id}
              className={`card flex flex-col gap-2 p-4 ${
                item.unlocked
                  ? 'border-amber-300/70 bg-gradient-to-b from-amber-50 to-transparent dark:border-amber-800 dark:from-amber-950/30'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl ${item.unlocked ? '' : 'opacity-40 grayscale'}`} aria-hidden>
                  {item.emoji}
                </span>
                {!item.unlocked ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    🔒 {t.achievementsLocked}
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm font-bold">{meta.title}</h3>
              <p className="text-xs text-muted">{meta.description}</p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
                role="progressbar"
                aria-valuenow={item.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={meta.title}
              >
                <div
                  className={`h-full rounded-full ${
                    item.unlocked ? 'bg-amber-500' : 'bg-brand-400'
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
