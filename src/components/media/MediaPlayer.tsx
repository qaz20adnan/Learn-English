'use client';

import { useCallback, useState } from 'react';
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
  // Runtime embed failure reported by the player (YouTube JSAPI onError).
  const [embedErrorCode, setEmbedErrorCode] = useState<number | null>(null);
  const [playerEpoch, setPlayerEpoch] = useState(0);
  // Key of the last failure already reported to /api/media/failures — dedupes
  // client-side per media+code (the endpoint dedupes again server-side).
  const [reportedKey, setReportedKey] = useState('');

  // Reset the runtime error when a different media item is opened. Done during
  // render (the React-recommended "adjust state when a prop changes" pattern):
  // the player is keyed by media id + epoch, so remounting is guaranteed.
  const mediaId = media?.id ?? null;
  const [prevMediaId, setPrevMediaId] = useState<string | null>(mediaId);
  if (mediaId !== prevMediaId) {
    setPrevMediaId(mediaId);
    setEmbedErrorCode(null);
    setForceLoad(false);
    setReportedKey('');
    setPlayerEpoch((epoch) => epoch + 1);
  }

  const handleEmbedError = useCallback(
    (code: number | null) => {
      setEmbedErrorCode(code);

      // Best-effort report for the admin reliability board. Fire-and-forget:
      // a failure here must never disturb the learner. Deduped client-side per
      // media+code and server-side with a 10-minute window.
      if (!media) return;
      const reportKey = `${media.id}:${code ?? 'x'}`;
      if (reportedKey === reportKey) return;
      setReportedKey(reportKey);
      void fetch('/api/media/failures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          provider: media.provider,
          errorCode: code,
        }),
      }).catch(() => undefined);
    },
    [media, reportedKey],
  );

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

  if (media.verificationStatus === 'UNAVAILABLE' && !forceLoad && embedErrorCode === null) {
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

  if (embedErrorCode !== null) {
    return (
      <Notice tone="warning" title={dict.media.embedError.title}>
        <p>{dict.media.embedError.body(embedErrorCode)}</p>
        <p className="mt-1">{dict.media.embedError.hint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {watchLink}
          <button
            type="button"
            onClick={() => {
              setReportedKey('');
              setEmbedErrorCode(null);
              setPlayerEpoch((epoch) => epoch + 1);
            }}
            className="rounded-lg border border-current px-3 py-1.5 text-xs font-bold"
          >
            {dict.media.embedError.retry}
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
          key={`yt-${media.id}-${playerEpoch}`}
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
          onEmbedError={handleEmbedError}
        />
      ) : media.provider === 'VIMEO' ? (
        <VimeoPlayer
          key={`vm-${media.id}-${playerEpoch}`}
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : (
        <Html5Player
          key={`html-${media.id}-${playerEpoch}`}
          media={media}
          startSeconds={startSeconds}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}
