'use client';

import { useEffect, useRef } from 'react';
import type { PlayerProps } from './types';

interface VimeoPlayerInstance {
  on: (event: string, handler: (data: { seconds: number; duration: number }) => void) => void;
  setCurrentTime: (seconds: number) => void;
  pause: () => void;
  destroy: () => Promise<void>;
}

interface VimeoNamespace {
  Player: new (element: HTMLIFrameElement, options?: Record<string, unknown>) => VimeoPlayerInstance;
}

declare global {
  interface Window {
    Vimeo?: VimeoNamespace;
  }
}

let apiPromise: Promise<VimeoNamespace> | null = null;

function loadVimeoApi(): Promise<VimeoNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => {
      if (window.Vimeo?.Player) resolve(window.Vimeo);
      else reject(new Error('Vimeo namespace missing'));
    };
    script.onerror = () => reject(new Error('تعذّر تحميل واجهة فيميو'));
    document.head.appendChild(script);
  });

  return apiPromise;
}

export function VimeoPlayer({ media, startSeconds, onProgress, onEnded }: PlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);

  useEffect(() => {
    progressRef.current = onProgress;
    endedRef.current = onEnded;
  }, [onProgress, onEnded]);

  useEffect(() => {
    let cancelled = false;
    let player: VimeoPlayerInstance | null = null;

    loadVimeoApi()
      .then((Vimeo) => {
        if (cancelled || !iframeRef.current) return;
        player = new Vimeo.Player(iframeRef.current);
        player.on('timeupdate', (data) => {
          if (data?.duration) progressRef.current(data.seconds, data.duration);
        });
        player.on('ended', () => endedRef.current());
        if (startSeconds > 0) player.setCurrentTime(startSeconds);
      })
      .catch(() => {
        /* Visible error handled by MediaPlayer. */
      });

    return () => {
      cancelled = true;
      player?.destroy().catch(() => undefined);
      player = null;
    };
  }, [media.externalId, startSeconds]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        ref={iframeRef}
        src={media.embedUrl ?? undefined}
        title={media.title ?? 'Vimeo video'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
