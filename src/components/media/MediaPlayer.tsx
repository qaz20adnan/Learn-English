'use client';

import { useState } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { VimeoPlayer } from './VimeoPlayer';
import { Html5Player } from './Html5Player';
import { PROVIDER_LABELS } from '@/lib/media';
import { useI18n } from '@/components/i18n/LocaleProvider';
import type { ClientMedia } from './types';

interface Props {
  media: ClientMedia | null;
  startSeconds: number;
  onProgress: (positionSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'neutral';
  title: string;
  children: React.ReactNode;
}) {
  const classes =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
      : 'border-line bg-ink-50 text-ink-700 dark:bg-ink-900 dark:text-ink-200';
  return (
    <div className={`rounded-xl border p-5 ${classes}`}>
      <p className="font-bold">{title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function MediaPlayer({ media, startSeconds, onProgress, onEnded }: Props) {
  const { dict } = useI18n();
  const [forceLoad, setForceLoad] = useState(false);

  if (!media) {
    return (
      <Notice tone="neutral" title={dict.media.textLesson.title}>
        {dict.media.textLesson.body}
      </Notice>
    );
  }

  const watchLink = media.watchUrl ? (
    <a
      href={media.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-brand-600 underline dark:text-brand-300"
    >
      {dict.media.openOriginal} ↗
    </a>
  ) : null;

  if (media.provider === 'NONE') {
    return (
      <Notice tone="warning" title={dict.media.invalidSource.title}>
        <p>
          {dict.media.invalidSource.body(media.url)} {media.verificationNote ?? ''}
        </p>
        {watchLink ? <p className="mt-2">{watchLink}</p> : null}
      </Notice>
    );
  }

  if (media.verificationStatus === 'UNAVAILABLE' && !forceLoad) {
    return (
      <Notice tone="warning" title={dict.media.unavailable.title}>
        <p>
          {dict.media.unavailable.body(
            PROVIDER_LABELS[media.provider],
            media.verificationNote ?? '',
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {watchLink}
          <button
            type="button"
            onClick={() => setForceLoad(true)}
            className="rounded-lg border border-current px-3 py-1.5 text-xs font-bold"
          >
            {dict.media.unavailable.force}
          </button>
        </div>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          {dict.media.source}: {PROVIDER_LABELS[media.provider]}
        </span>
        <span aria-hidden>·</span>
        <span>
          {dict.media.linkStatus}: {dict.media.verification[media.verificationStatus]}
        </span>
        {watchLink}
      </div>

      {media.provider === 'YOUTUBE' ? (
        <YouTubePlayer
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : media.provider === 'VIMEO' ? (
        <VimeoPlayer
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : (
        <Html5Player
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}
