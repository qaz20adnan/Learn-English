/**
 * Gamification rules for the learning progress system.
 *
 * Everything here is pure so it can be unit tested without a database or clock.
 * The database layer only stores the ledger rows and persisted scores.
 */
import type { Grade } from './srs';

/** Flat point rewards for discrete learning events. */
export const POINTS = {
  lessonComplete: 20,
  /** Points awarded per correct answer in a story comprehension quiz. */
  storyCorrect: 5,
} as const;

/**
 * Points earned when grading a flashcard. `again` earns nothing so that
 * repeatedly failing a card cannot be farmed for points.
 */
export function pointsForGrade(grade: Grade): number {
  switch (grade) {
    case 'again':
      return 0;
    case 'hard':
      return 1;
    case 'good':
      return 2;
    case 'easy':
      return 3;
    default:
      return 0;
  }
}

export interface LevelBand {
  key: string;
  min: number;
}

/** Ascending point thresholds, used for the learner rank badge. */
export const LEVEL_BANDS: LevelBand[] = [
  { key: 'novice', min: 0 },
  { key: 'learner', min: 100 },
  { key: 'achiever', min: 300 },
  { key: 'expert', min: 700 },
  { key: 'ambassador', min: 1500 },
];

export interface LevelInfo {
  index: number;
  key: string;
  min: number;
  /** Points required for the next band, or null when at the top band. */
  next: number | null;
  /** Progress through the current band, 0..1. */
  progress: number;
}

export function levelForPoints(points: number): LevelInfo {
  const safe = Math.max(0, Math.floor(points));
  let index = 0;
  for (let i = 0; i < LEVEL_BANDS.length; i += 1) {
    if (safe >= LEVEL_BANDS[i].min) index = i;
  }
  const band = LEVEL_BANDS[index];
  const next = LEVEL_BANDS[index + 1]?.min ?? null;
  const progress =
    next === null ? 1 : Math.min(1, Math.max(0, (safe - band.min) / (next - band.min)));
  return { index, key: band.key, min: band.min, next, progress };
}

/** UTC day key (`YYYY-MM-DD`) for an ISO timestamp. */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Counts consecutive active days ending today (or yesterday when the learner
 * has not been active yet today), based on a list of ISO timestamps.
 */
export function computeStreak(isoTimestamps: string[], now = new Date()): number {
  const days = new Set(isoTimestamps.map(dayKey));
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Points to award for a repeatable activity, counting only the *improvement*
 * over the previous best so the same quiz or story cannot be farmed forever.
 */
export function pointsForImprovement(newScore: number, previousBest: number): number {
  return Math.max(0, Math.round(newScore) - Math.max(0, Math.round(previousBest)));
}
