import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, buildAchievements, countUnlocked } from './achievements';

const input = (overrides: Partial<Parameters<typeof buildAchievements>[0]> = {}) => ({
  lessonsCompleted: 0,
  quizzesPassed: 0,
  storiesStarted: 0,
  reviewsDone: 0,
  pointsTotal: 0,
  currentStreak: 0,
  ...overrides,
});

describe('achievements', () => {
  it('marks a badge unlocked exactly at the target', () => {
    const views = buildAchievements(input({ lessonsCompleted: 1 }));
    const firstLesson = views.find((view) => view.id === 'firstLesson');
    expect(firstLesson?.unlocked).toBe(true);
    expect(firstLesson?.percent).toBe(100);

    const atEdge = buildAchievements(input({ pointsTotal: 499, lessonsCompleted: 1 }));
    expect(atEdge.find((view) => view.id === 'points500')?.unlocked).toBe(false);
    const justOver = buildAchievements(input({ pointsTotal: 500, lessonsCompleted: 1 }));
    expect(justOver.find((view) => view.id === 'points500')?.unlocked).toBe(true);
  });

  it('clamps progress to 0-100 for overachievement', () => {
    const views = buildAchievements(input({ lessonsCompleted: 40 }));
    const lessons25 = views.find((view) => view.id === 'lessons25');
    expect(lessons25?.percent).toBe(100);
    expect(lessons25?.current).toBe(40);
  });

  it('leads with unlocked badges, then closest locked ones', () => {
    const views = buildAchievements(
      input({ lessonsCompleted: 10, storiesStarted: 1, currentStreak: 6 }),
    );
    const unlockedFlags = views.map((view) => view.unlocked);
    const firstLockedIndex = unlockedFlags.indexOf(false);
    expect(unlockedFlags.slice(0, firstLockedIndex).every(Boolean)).toBe(true);
    expect(unlockedFlags.slice(firstLockedIndex).every((flag) => !flag)).toBe(true);

    // Among locked badges, the one closest to unlocking comes first.
    const locked = views.slice(firstLockedIndex);
    expect(locked[0].id).toBe('streak7'); // 6/7 ≈ 86%.
  });

  it('ranks locked badges by progress percentage', () => {
    const views = buildAchievements(input({ lessonsCompleted: 3, currentStreak: 6, pointsTotal: 250 }));
    const locked = views.filter((view) => !view.unlocked);
    // streak7 = 6/7 ≈ 86%, points500 = 50%, firstQuiz = 0%.
    expect(locked[0].id).toBe('streak7');
    expect(locked[1].id).toBe('points500');
  });

  it('counts unlocked badges', () => {
    // firstLesson + lessons10 + firstQuiz + firstStory = 4.
    const views = buildAchievements(input({ lessonsCompleted: 10, quizzesPassed: 1, storiesStarted: 1 }));
    expect(countUnlocked(views)).toBe(4);
  });

  it('ships a fixed, documented badge set', () => {
    expect(ACHIEVEMENTS.map((def) => def.id)).toEqual([
      'firstLesson',
      'firstQuiz',
      'firstStory',
      'lessons10',
      'points500',
      'streak7',
      'quizzes10',
      'lessons25',
    ]);
  });
});
