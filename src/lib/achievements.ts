/**
 * Achievements (Sprint 5 — IMPROVEMENT_PLAN 3.1, item "الإنجازات (بداية)").
 *
 * Pure logic: every badge is computed from real, already-collected learner
 * numbers — never from promises, streaks of missing data or invented metrics
 * (roadmap rule: "تحليلات تعلم تفاعلية — فقط بمؤشرات لها بيانات فعلية").
 *
 * Badge titles/descriptions live in the i18n dictionaries under
 * `dashboard.achievements.items.<id>`; this module only ships ids, emojis and
 * progress math.
 */

export interface AchievementInput {
  lessonsCompleted: number;
  quizzesPassed: number;
  storiesStarted: number;
  reviewsDone: number;
  pointsTotal: number;
  currentStreak: number;
}

export interface AchievementDef {
  id: string;
  emoji: string;
  metric: keyof AchievementInput;
  target: number;
}

export interface AchievementView {
  id: string;
  emoji: string;
  unlocked: boolean;
  current: number;
  target: number;
  /** 0-100, clamped. */
  percent: number;
}

/** Ordered starter set: earliest wins first, bigger tiers later. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstLesson', emoji: '🌱', metric: 'lessonsCompleted', target: 1 },
  { id: 'firstQuiz', emoji: '📝', metric: 'quizzesPassed', target: 1 },
  { id: 'firstStory', emoji: '📖', metric: 'storiesStarted', target: 1 },
  { id: 'lessons10', emoji: '📚', metric: 'lessonsCompleted', target: 10 },
  { id: 'points500', emoji: '⭐', metric: 'pointsTotal', target: 500 },
  { id: 'streak7', emoji: '🔥', metric: 'currentStreak', target: 7 },
  { id: 'quizzes10', emoji: '🏅', metric: 'quizzesPassed', target: 10 },
  { id: 'lessons25', emoji: '🎓', metric: 'lessonsCompleted', target: 25 },
];

/**
 * Builds badge views: unlocked badges first (definition order), then the
 * closest-to-unlock locked badges — so the strip always leads with progress.
 */
export function buildAchievements(input: AchievementInput): AchievementView[] {
  const views: AchievementView[] = ACHIEVEMENTS.map((def) => {
    const current = Math.max(0, input[def.metric] ?? 0);
    const percent = Math.min(100, Math.round((current / def.target) * 100));
    return {
      id: def.id,
      emoji: def.emoji,
      unlocked: current >= def.target,
      current,
      target: def.target,
      percent,
    };
  });
  const unlocked = views.filter((view) => view.unlocked);
  const locked = views
    .filter((view) => !view.unlocked)
    .sort((a, b) => b.percent - a.percent || a.target - b.target);
  return [...unlocked, ...locked];
}

/** Number of badges the learner has unlocked (used for the section subtitle). */
export function countUnlocked(views: readonly AchievementView[]): number {
  return views.filter((view) => view.unlocked).length;
}
