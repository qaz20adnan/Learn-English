'use client';

import { useEffect, useRef } from 'react';
import { buildEmbedUrl } from '@/lib/media';
import type { PlayerProps } from './types';

/**
 * Plays a YouTube video through a direct embed iframe
 * (`https://www.youtube.com/embed/<id>`) instead of relying on the external
 * IFrame Player API script. This guarantees the lesson plays inside the page
 * even when the API script is blocked or slow, and it degrades gracefully:
 * playback is independent from progress reporting.
 *
 * Progress is tracked with the iframe messaging protocol (`enablejsapi=1`) on a
 * best-effort basis — if the messages never arrive, the video still plays.
 */
export function YouTubePlayer({ media, startSeconds, onProgress, onEnded }: PlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  const startRef = useRef(startSeconds);

  useEffect(() => {
    progressRef.current = onProgress;
    endedRef.current = onEnded;
  }, [onProgress, onEnded]);

  const embedUrl =
    media.embedUrl ??
    (media.externalId ? buildEmbedUrl('YOUTUBE', media.externalId, media.url) : null);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame || !embedUrl) return;

    const frameId = frame.id;
    let ready = false;

    const post = (payload: Record<string, unknown>) => {
      frame.contentWindow?.postMessage(JSON.stringify(payload), 'https://www.youtube.com');
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      if (event.source !== frame.contentWindow) return;

      let data: { event?: string; info?: unknown };
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      if (data.event === 'onReady') {
        ready = true;
        post({
          event: 'command',
          func: 'addEventListener',
          args: ['infoDelivery'],
          id: frameId,
          channel: 'widget',
        });
        if (startRef.current > 0) {
          post({
            event: 'command',
            func: 'seekTo',
            args: [startRef.current, true],
            id: frameId,
            channel: 'widget',
          });
        }
        return;
      }

      if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
        const info = data.info as { currentTime?: number; duration?: number };
        if (
          typeof info.currentTime === 'number' &&
          typeof info.duration === 'number' &&
          info.duration > 0
        ) {
          progressRef.current(info.currentTime, info.duration);
        }
        return;
      }

      if (data.event === 'onStateChange' && data.info === 0) {
        endedRef.current();
      }
    };

    window.addEventListener('message', handleMessage);

    const handshake = window.setInterval(() => {
      post({ event: 'listening', id: frameId, channel: 'widget' });
      if (ready) {
        post({ event: 'command', func: 'getCurrentTime', args: [], id: frameId, channel: 'widget' });
      }
    }, 2000);
    post({ event: 'listening', id: frameId, channel: 'widget' });

    return () => {
      window.removeEventListener('message', handleMessage);
      window.clearInterval(handshake);
    };
  }, [embedUrl]);

  if (!embedUrl) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        ref={iframeRef}
        id={`yt-${media.id}`}
        src={embedUrl}
        title={media.title ?? 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
