'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ClientProgress {
  lessonId: string;
  status: ProgressStatus;
  positionSeconds: number;
  percent: number;
}

interface Options {
  initial: ClientProgress;
}

const MIN_INTERVAL_MS = 5000;

/**
 * Persists playback progress to the server.
 *
 * Completion is never inferred from merely opening a lesson: it only happens
 * when the learner reaches the auto-complete threshold or presses the explicit
 * "mark complete" control. The highest percent reached is monotonic so rewinding
 * never lowers the recorded progress.
 */
export function useProgressReporter(lessonId: string, { initial }: Options) {
  const [progress, setProgress] = useState<ClientProgress>(initial);
  const lastSentAt = useRef(0);
  const latest = useRef({ positionSeconds: initial.positionSeconds, percent: initial.percent });
  const maxPercent = useRef(initial.percent);

  const send = useCallback(
    async (
      payload: { positionSeconds: number; percent: number; completed?: boolean },
      force = false,
    ) => {
      const now = Date.now();
      if (!force && now - lastSentAt.current < MIN_INTERVAL_MS) return;
      lastSentAt.current = now;
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, ...payload }),
          keepalive: true,
        });
        if (res.ok) {
          const data = (await res.json()) as { progress: ClientProgress };
          setProgress(data.progress);
        }
      } catch {
        // Network hiccups are non-fatal; the next heartbeat retries.
      }
    },
    [lessonId],
  );

  const reportTime = useCallback(
    (positionSeconds: number, durationSeconds: number) => {
      const percent =
        durationSeconds > 0 ? Math.min(100, (positionSeconds / durationSeconds) * 100) : 0;
      if (percent > maxPercent.current) maxPercent.current = percent;
      latest.current = { positionSeconds, percent: maxPercent.current };
      void send({ positionSeconds, percent: maxPercent.current });
    },
    [send],
  );

  const markComplete = useCallback(() => {
    void send(
      { positionSeconds: latest.current.positionSeconds, percent: 100, completed: true },
      true,
    );
  }, [send]);

  useEffect(() => {
    const flush = () => {
      if (navigator.sendBeacon) {
        const body = new Blob(
          [
            JSON.stringify({
              lessonId,
              positionSeconds: latest.current.positionSeconds,
              percent: latest.current.percent,
            }),
          ],
          { type: 'application/json' },
        );
        navigator.sendBeacon('/api/progress', body);
      }
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [lessonId]);

  return { progress, reportTime, markComplete };
}
