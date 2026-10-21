'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/cn';

export function FavoriteButton({
  vocabId,
  initialFavorite,
  showLabel = false,
}: {
  vocabId: string;
  initialFavorite: boolean;
  showLabel?: boolean;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    const next = !favorite;
    setFavorite(next);
    setBusy(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabId, favorite: next }),
      });
      if (!res.ok) throw new Error('failed');
      startTransition(() => router.refresh());
    } catch {
      setFavorite(!next);
    } finally {
      setBusy(false);
    }
  }

  const label = favorite ? dict.favorites.removeFavorite : dict.favorites.addFavorite;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition disabled:opacity-60',
        favorite
          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-line text-muted hover:border-amber-400 hover:text-amber-600',
      )}
    >
      <span aria-hidden>{favorite ? '⭐' : '☆'}</span>
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
