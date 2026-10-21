import { describe, expect, it } from 'vitest';
import {
  POINTS,
  computeStreak,
  levelForPoints,
  pointsForGrade,
  pointsForImprovement,
} from './points';

describe('pointsForGrade', () => {
  it('rewards higher grades and gives nothing for "again"', () => {
    expect(pointsForGrade('again')).toBe(0);
    expect(pointsForGrade('hard')).toBe(1);
    expect(pointsForGrade('good')).toBe(2);
    expect(pointsForGrade('easy')).toBe(3);
  });
});

describe('POINTS', () => {
  it('defines flat rewards', () => {
    expect(POINTS.lessonComplete).toBe(20);
    expect(POINTS.storyCorrect).toBe(5);
  });
});

describe('levelForPoints', () => {
  it('maps totals to ascending bands', () => {
    expect(levelForPoints(0).key).toBe('novice');
    expect(levelForPoints(99).key).toBe('novice');
    expect(levelForPoints(100).key).toBe('learner');
    expect(levelForPoints(300).key).toBe('achiever');
    expect(levelForPoints(700).key).toBe('expert');
    expect(levelForPoints(1500).key).toBe('ambassador');
  });

  it('reports the next threshold and progress within the band', () => {
    const info = levelForPoints(50);
    expect(info.next).toBe(100);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it('sits at the top band with full progress', () => {
    const info = levelForPoints(5000);
    expect(info.next).toBeNull();
    expect(info.progress).toBe(1);
  });
});

describe('computeStreak', () => {
  const now = new Date('2026-01-10T12:00:00.000Z');

  it('counts consecutive days ending today', () => {
    const dates = [
      '2026-01-10T08:00:00.000Z',
      '2026-01-09T08:00:00.000Z',
      '2026-01-08T08:00:00.000Z',
    ];
    expect(computeStreak(dates, now)).toBe(3);
  });

  it('breaks the streak on a gap', () => {
    const dates = ['2026-01-10T08:00:00.000Z', '2026-01-08T08:00:00.000Z'];
    expect(computeStreak(dates, now)).toBe(1);
  });

  it('counts a streak ending yesterday when inactive today', () => {
    const dates = ['2026-01-09T08:00:00.000Z', '2026-01-08T08:00:00.000Z'];
    expect(computeStreak(dates, now)).toBe(2);
  });

  it('returns zero with no activity', () => {
    expect(computeStreak([], now)).toBe(0);
  });
});

describe('pointsForImprovement', () => {
  it('awards only the gain over the previous best', () => {
    expect(pointsForImprovement(8, 5)).toBe(3);
    expect(pointsForImprovement(5, 5)).toBe(0);
    expect(pointsForImprovement(4, 5)).toBe(0);
    expect(pointsForImprovement(6, 0)).toBe(6);
  });
});
