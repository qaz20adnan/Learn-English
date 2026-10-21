/**
 * A small SM-2 inspired spaced-repetition scheduler.
 *
 * Pure and side-effect free so it can be unit tested without a database or
 * clock. The database layer persists the returned state.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const RELEARN_MINUTES = 10;

export function initialState(now = new Date()): SrsResult {
  return { ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueAt: now };
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

export function schedule(state: SrsState, grade: Grade, now = new Date()): SrsResult {
  let { ease, intervalDays, repetitions, lapses } = state;

  switch (grade) {
    case 'again': {
      ease = Math.max(MIN_EASE, ease - 0.2);
      repetitions = 0;
      lapses += 1;
      intervalDays = 0;
      return { ease, intervalDays, repetitions, lapses, dueAt: addMinutes(now, RELEARN_MINUTES) };
    }
    case 'hard': {
      ease = Math.max(MIN_EASE, ease - 0.15);
      repetitions += 1;
      intervalDays = intervalDays < 1 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
      return { ease, intervalDays, repetitions, lapses, dueAt: addDays(now, intervalDays) };
    }
    case 'easy': {
      ease = Math.min(MAX_EASE, ease + 0.15);
      repetitions += 1;
      if (intervalDays < 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(intervalDays * ease * 1.3);
      }
      return { ease, intervalDays, repetitions, lapses, dueAt: addDays(now, intervalDays) };
    }
    case 'good':
    default: {
      repetitions += 1;
      if (intervalDays < 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(intervalDays * ease);
      }
      return { ease, intervalDays, repetitions, lapses, dueAt: addDays(now, intervalDays) };
    }
  }
}

export function isDue(dueAt: string | Date, now = new Date()): boolean {
  return new Date(dueAt).getTime() <= now.getTime();
}

export const GRADE_LABELS: Record<Grade, string> = {
  again: 'أعِد',
  hard: 'صعب',
  good: 'جيد',
  easy: 'سهل',
};
