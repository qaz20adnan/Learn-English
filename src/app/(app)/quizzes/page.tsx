import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listQuizBestScores, listQuizzesPaged, type QuizStatusFilter } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { quizPercent } from '@/lib/progression';
import { LEVELS } from '@/lib/types';
import { Card, EmptyState, LevelBadge, SectionTitle } from '@/components/ui';

/**
 * Quiz library with search, level/status filters and pagination (T3).
 *
 * Everything is server-rendered: the toolbar is a plain GET `<form>`, and
 * pagination is regular `<Link>`s, so the library stays fully usable without
 * JavaScript and never ships the 400+ quiz cards in one response.
 */

const PAGE_SIZE = 24;

const STATUS_VALUES = ['all', 'passed', 'remaining'] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function readFilters(searchParams: SearchParams) {
  const q = first(searchParams.q);
  const levelRaw = first(searchParams.level);
  const level = LEVELS.find((candidate) => candidate === levelRaw);
  const statusRaw = first(searchParams.status) ?? 'all';
  const status = (STATUS_VALUES.find((candidate) => candidate === statusRaw) ??
    'all') as QuizStatusFilter;
  const page = Math.max(1, Number.parseInt(first(searchParams.page) ?? '1', 10) || 1);
  return { q, level, status, page };
}

function pageHref(
  base: { q?: string; level?: string; status: QuizStatusFilter },
  page: number,
): string {
  const params = new URLSearchParams();
  if (base.q) params.set('q', base.q);
  if (base.level) params.set('level', base.level);
  if (base.status !== 'all') params.set('status', base.status);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/quizzes?${query}` : '/quizzes';
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.quizzes.metaTitle };
}

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.quizzes;
  const tb = t.toolbar;

  const resolved = await searchParams;
  const filters = readFilters(resolved);

  const [result, best] = await Promise.all([
    listQuizzesPaged(user.id, { ...filters, pageSize: PAGE_SIZE }),
    listQuizBestScores(user.id),
  ]);

  const hasActiveFilters = Boolean(filters.q || filters.level || filters.status !== 'all');

  // Compact pagination window: first · … · around current · … · last.
  const paginationItems: Array<number | 'gap'> = [];
  const windowStart = Math.max(2, result.page - 1);
  const windowEnd = Math.min(result.totalPages - 1, result.page + 1);
  paginationItems.push(1);
  if (windowStart > 2) paginationItems.push('gap');
  for (let p = windowStart; p <= windowEnd; p += 1) paginationItems.push(p);
  if (windowEnd < result.totalPages - 1) paginationItems.push('gap');
  if (result.totalPages > 1) paginationItems.push(result.totalPages);

  const selectClass =
    'rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-800 dark:text-ink-100';
  const labelClass = 'text-xs font-bold text-muted';

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t.title} description={t.description} />

      <form method="get" action="/quizzes" className="flex flex-col gap-3" role="search">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tb.searchLabel}</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q ?? ''}
              placeholder={tb.searchPlaceholder}
              className={selectClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tb.levelLabel}</span>
            <select name="level" defaultValue={filters.level ?? ''} className={selectClass}>
              <option value="">{tb.levelAll}</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {dict.levels[level]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tb.statusLabel}</span>
            <select name="status" defaultValue={filters.status} className={selectClass}>
              <option value="all">{tb.statusAll}</option>
              <option value="passed">{tb.statusPassed}</option>
              <option value="remaining">{tb.statusRemaining}</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {tb.apply}
            </button>
            {hasActiveFilters ? (
              <Link
                href="/quizzes"
                className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-muted transition hover:bg-ink-50 dark:hover:bg-ink-900"
              >
                {tb.reset}
              </Link>
            ) : null}
          </div>
        </div>
        {hasActiveFilters ? (
          <p className="text-xs font-semibold text-muted">
            {tb.resultsCount(result.items.length, result.total)}
          </p>
        ) : null}
      </form>

      {result.total === 0 ? (
        hasActiveFilters ? (
          <EmptyState emoji="🔍" title={tb.noResultsTitle} description={tb.noResultsBody} />
        ) : (
          <EmptyState emoji="📝" title={t.emptyTitle} description={t.emptyDescription} />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.items.map((quiz) => {
              const score = best[quiz.id];
              const percent = score ? quizPercent(score.scorePoints, score.maxPoints) : null;
              const passed = percent !== null && percent >= quiz.passPercent;
              return (
                <Card key={quiz.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>
                        📝
                      </span>
                      <div>
                        <h3 className="font-bold">{quiz.titleAr ?? quiz.title}</h3>
                        <p className="text-xs text-muted">{quiz.description}</p>
                      </div>
                    </div>
                    <LevelBadge level={quiz.level} label={dict.levels[quiz.level]} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{t.questionsCount(quiz.questionCount ?? 0)}</span>
                    <span aria-hidden>·</span>
                    <span>{t.pointsAvailable(quiz.totalPoints ?? 0)}</span>
                    <span aria-hidden>·</span>
                    <span>{t.passMark(quiz.passPercent)}</span>
                    {passed ? <span className="font-bold text-emerald-600">✓ {t.passedBadge}</span> : null}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs font-semibold text-muted">
                      {score ? t.bestScore(score.scorePoints, score.maxPoints) : t.notAttempted}
                    </span>
                    <Link
                      href={`/quizzes/${quiz.slug}`}
                      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
                    >
                      {t.start}
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {result.totalPages > 1 ? (
            <nav
              aria-label={tb.pageInfo(result.page, result.totalPages)}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {result.page > 1 ? (
                <Link
                  href={pageHref(filters, result.page - 1)}
                  className="rounded-xl border border-line px-3 py-2 text-sm font-bold transition hover:bg-ink-50 dark:hover:bg-ink-900"
                  rel="prev"
                >
                  ‹ {tb.prev}
                </Link>
              ) : null}
              {paginationItems.map((item, index) =>
                item === 'gap' ? (
                  <span key={`gap-${index}`} className="px-1 text-sm text-muted" aria-hidden>
                    …
                  </span>
                ) : item === result.page ? (
                  <span
                    key={item}
                    aria-current="page"
                    className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-bold text-white"
                  >
                    {item}
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={pageHref(filters, item)}
                    className="rounded-xl border border-line px-3.5 py-2 text-sm font-bold transition hover:bg-ink-50 dark:hover:bg-ink-900"
                  >
                    {item}
                  </Link>
                ),
              )}
              {result.page < result.totalPages ? (
                <Link
                  href={pageHref(filters, result.page + 1)}
                  className="rounded-xl border border-line px-3 py-2 text-sm font-bold transition hover:bg-ink-50 dark:hover:bg-ink-900"
                  rel="next"
                >
                  {tb.next} ›
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
