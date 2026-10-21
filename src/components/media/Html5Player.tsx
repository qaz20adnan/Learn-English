'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/components/i18n/LocaleProvider';
import type { PlayerProps } from './types';

export function Html5Player({ media, startSeconds, onProgress, onEnded }: PlayerProps) {
  const { dict } = useI18n();
  const ref = useRef<HTMLMediaElement>(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);

  useEffect(() => {
    progressRef.current = onProgress;
    endedRef.current = onEnded;
  }, [onProgress, onEnded]);

  useEffect(() => {
    const element = ref.current;
    if (!element || startSeconds <= 0) return;
    const applySeek = () => {
      if (Number.isFinite(element.duration) && element.duration > startSeconds) {
        element.currentTime = startSeconds;
      }
    };
    applySeek();
    element.addEventListener('loadedmetadata', applySeek);
    return () => element.removeEventListener('loadedmetadata', applySeek);
  }, [startSeconds, media.url]);

  const handleTime = () => {
    const element = ref.current;
    if (!element) return;
    const duration = element.duration;
    if (Number.isFinite(duration) && duration > 0) {
      progressRef.current(element.currentTime, duration);
    }
  };

  const src = media.url ?? media.embedUrl ?? undefined;

  if (media.provider === 'AUDIO_FILE') {
    return (
      <div className="rounded-xl border border-line surface p-4">
        <audio
          ref={ref as React.RefObject<HTMLAudioElement>}
          src={src}
          controls
          preload="metadata"
          className="w-full"
          onTimeUpdate={handleTime}
          onEnded={() => endedRef.current()}
        >
          {dict.media.audioFallback}
        </audio>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref as React.RefObject<HTMLVideoElement>}
        src={src}
        controls
        preload="metadata"
        playsInline
        className="h-full w-full"
        onTimeUpdate={handleTime}
        onEnded={() => endedRef.current()}
      >
        {dict.media.videoFallback}
      </video>
    </div>
  );
}
