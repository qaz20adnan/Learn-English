'use client';

import { MediaPlayer } from './MediaPlayer';
import { useProgressReporter, type ProgressStatus } from './useProgressReporter';
import type { ClientMedia } from './types';
import { useI18n } from '@/components/i18n/LocaleProvider';
import { ProgressBar } from '@/components/ui';

interface Props {
  lessonId: string;
  media: ClientMedia | null;
  initial: { status: ProgressStatus; positionSeconds: number; percent: number };
}

export function LessonExperience({ lessonId, media, initial }: Props) {
  const { dict } = useI18n();
  const { progress, reportTime, markComplete } = useProgressReporter(lessonId, {
    initial: { lessonId, ...initial },
  });

  const done = progress.status === 'COMPLETED';
  const percent = Math.round(progress.percent);

  return (
    <div className="flex flex-col gap-4">
      <MediaPlayer
        media={media}
        startSeconds={initial.positionSeconds}
        onProgress={reportTime}
        onEnded={markComplete}
      />

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold">
            {dict.lesson.statusPrefix} {dict.lesson.status[progress.status]}
          </span>
          <span className="text-xs text-muted">{dict.lesson.autosave(percent)}</span>
        </div>
        <ProgressBar value={progress.percent} label={`${percent}%`} />
        <div className="flex flex-wrap items-center gap-3">
          {!done ? (
            <button
              type="button"
              onClick={markComplete}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {dict.lesson.markComplete}
            </button>
          ) : (
            <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
              {dict.lesson.completedBadge}
            </span>
          )}
          <span className="text-xs text-muted">{dict.lesson.completionNote}</span>
        </div>
      </div>
    </div>
  );
}
