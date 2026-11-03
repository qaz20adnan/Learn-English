'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { showToast } from '@/components/ui/toast';
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
      showToast({
        message: next ? dict.toasts.favoriteAdded : dict.toasts.favoriteRemoved,
        tone: 'success',
      });
      startTransition(() => router.refresh());
    } catch {
      setFavorite(!next);
      showToast({ message: dict.toasts.actionFailed, tone: 'warning' });
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
          ? 'border-warning-500/50 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-200'
          : 'border-line text-muted hover:border-warning-500 hover:text-warning-600',
      )}
    >
      <Heart
        className={cn('size-3.5', favorite && 'fill-current')}
        aria-hidden
      />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
