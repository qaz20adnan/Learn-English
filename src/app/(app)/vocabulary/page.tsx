import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import {
  countDueReviews,
  countVocabulary,
  listFavoriteIds,
  listVocabulary,
  listVocabularyPaged,
  listVocabularyPartsOfSpeech,
} from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { LEVELS, type Level } from '@/lib/types';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui';
import { FavoriteButton } from '@/components/vocab/FavoriteButton';

/**
 * Vocabulary library with search, CEFR-level/part-of-speech filters and a
 * practice deck (Sprint 2).
 *
 * Two browse modes:
 * - No filters: a fresh random sample of the bank on every visit (as before).
 * - Any filter/search: deterministic alphabetical pages with pagination.
 *
 * Everything is server-rendered: the toolbar is a plain GET `<form>` and the
 * practice deck is reached via a second submit button (`formAction`), so the
 * whole page stays usable without JavaScript.
 */

const RANDOM_SAMPLE = 30;
const FILTERED_PAGE_SIZE = 36;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function readFilters(searchParams: SearchParams) {
  const q = first(searchParams.q);
  const levelRaw = first(searchParams.level);
  const level = LEVELS.find((candidate) => candidate === levelRaw) as Level | undefined;
  const pos = first(searchParams.pos);
  const page = Math.max(1, Number.parseInt(first(searchParams.page) ?? '1', 10) || 1);
  return { q, level, pos, page };
}

function vocabularyHref(
  base: { q?: string; level?: string; pos?: string },
  page?: number,
): string {
  const params = new URLSearchParams();
  if (base.q) params.set('q', base.q);
  if (base.level) params.set('level', base.level);
  if (base.pos) params.set('pos', base.pos);
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/vocabulary?${query}` : '/vocabulary';
}

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getLocaleAndDictionary();
  return { title: dict.vocabulary.metaTitle };
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const { dict } = await getLocaleAndDictionary();
  const t = dict.vocabulary;
  const tb = t.toolbar;

  const resolved = await searchParams;
  const filters = readFilters(resolved);
  const hasActiveFilters = Boolean(filters.q || filters.level || filters.pos);

  const [due, favoriteIdList, partsOfSpeech] = await Promise.all([
    countDueReviews(user.id),
    listFavoriteIds(user.id),
    listVocabularyPartsOfSpeech(),
  ]);
  const favoriteIds = new Set(favoriteIdList);

  // Filtered mode returns stable alphabetical pages; plain mode shuffles.
  const result = hasActiveFilters
    ? await listVocabularyPaged({ ...filters, pageSize: FILTERED_PAGE_SIZE })
    : null;
  const [words, total] = result
    ? [result.items, result.total]
    : await Promise.all([
        listVocabulary({ limit: RANDOM_SAMPLE }),
        countVocabulary(),
      ]);

  // Compact pagination window: first · … · around current · … · last.
  const paginationItems: Array<number | 'gap'> = [];
  if (result && result.totalPages > 1) {
    const windowStart = Math.max(2, result.page - 1);
    const windowEnd = Math.min(result.totalPages - 1, result.page + 1);
    paginationItems.push(1);
    if (windowStart > 2) paginationItems.push('gap');
    for (let p = windowStart; p <= windowEnd; p += 1) paginationItems.push(p);
    if (windowEnd < result.totalPages - 1) paginationItems.push('gap');
    paginationItems.push(result.totalPages);
  }

  const selectClass =
    'rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-800 dark:text-ink-100';
  const labelClass = 'text-xs font-bold text-muted';

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title={t.title}
        description={t.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/review"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              🔁 {t.startReview}
              {due > 0 ? ` (${due})` : ''}
            </Link>
            {!hasActiveFilters ? (
              <Link
                href="/vocabulary"
                prefetch={false}
                className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-400"
              >
                {t.reshuffle}
              </Link>
            ) : null}
            <Link
              href="/favorites"
              className="rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:border-amber-400"
            >
              ⭐ {dict.favorites.metaTitle}
            </Link>
          </div>
        }
      />

      <form method="get" action="/vocabulary" className="flex flex-col gap-3" role="search">
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
            <span className={labelClass}>{tb.posLabel}</span>
            <select name="pos" defaultValue={filters.pos ?? ''} className={selectClass}>
              <option value="">{tb.posAll}</option>
              {partsOfSpeech.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {tb.apply}
            </button>
            <button
              type="submit"
              formAction="/vocabulary/practice"
              className="rounded-xl border border-brand-400 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
            >
              {tb.practiceCta}
            </button>
            {hasActiveFilters ? (
              <Link
                href="/vocabulary"
                className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-muted transition hover:bg-ink-50 dark:hover:bg-ink-900"
              >
                {tb.reset}
              </Link>
            ) : null}
          </div>
        </div>

        <p className="text-xs font-semibold text-muted">
          {hasActiveFilters
            ? tb.resultsCount(words.length, total)
            : `${t.available(total)} · ${tb.randomHint}`}
        </p>
      </form>

      {due > 0 ? (
        <div className="card border-brand-300 bg-brand-50 p-4 text-sm font-semibold text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
          {t.due(due)}
        </div>
      ) : null}

      {words.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState emoji="🔍" title={tb.noResultsTitle} description={tb.noResultsBody} />
        ) : (
          <EmptyState
            emoji="🧠"
            title={t.emptyTitle}
            description={t.emptyDescription}
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((word) => (
              <Card key={word.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span dir="ltr" className="force-ltr text-lg font-extrabold">
                    {word.term}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{word.partOfSpeech}</Badge>
                    <FavoriteButton
                      vocabId={word.id}
                      initialFavorite={favoriteIds.has(word.id)}
                    />
                  </div>
                </div>
                <span className="font-semibold">{word.translation}</span>
                {word.phonetic ? (
                  <span dir="ltr" className="force-ltr text-xs text-muted">
                    {word.phonetic}
                  </span>
                ) : null}
                {word.example ? (
                  <p dir="ltr" className="force-ltr text-sm text-muted">
                    {word.example}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>

          {result && result.totalPages > 1 ? (
            <nav
              aria-label={tb.pageInfo(result.page, result.totalPages)}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {result.page > 1 ? (
                <Link
                  href={vocabularyHref(filters, result.page - 1)}
                  prefetch={false}
                  className="rounded-xl border border-line px-3 py-2 text-sm font-bold transition hover:border-brand-400"
                >
                  ← {tb.prev}
                </Link>
              ) : null}
              {paginationItems.map((item, index) =>
                item === 'gap' ? (
                  <span key={`gap-${index}`} className="px-1 text-sm text-muted">
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={vocabularyHref(filters, item)}
                    prefetch={false}
                    aria-current={item === result.page ? 'page' : undefined}
                    className={
                      item === result.page
                        ? 'rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-white'
                        : 'rounded-xl border border-line px-3 py-2 text-sm font-bold transition hover:border-brand-400'
                    }
                  >
                    {item}
                  </Link>
                ),
              )}
              {result.page < result.totalPages ? (
                <Link
                  href={vocabularyHref(filters, result.page + 1)}
                  prefetch={false}
                  className="rounded-xl border border-line px-3 py-2 text-sm font-bold transition hover:border-brand-400"
                >
                  {tb.next} →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
