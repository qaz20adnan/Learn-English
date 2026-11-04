import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getDictionary } from '@/lib/i18n';
import { AchievementsStrip } from './AchievementsStrip';
import { ContinueLearningCard } from './ContinueLearningCard';
import { DailyGoalCard } from './DailyGoalCard';
import { RoadmapTeaserCard } from './RoadmapTeaserCard';
import type { ContinueLesson, DailyProgress, RoadmapData } from '@/lib/db/queries';
import type { AchievementView } from '@/lib/achievements';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const dict = getDictionary('ar');

const dailyProgress = (overrides: Partial<DailyProgress> = {}): DailyProgress => ({
  goalMinutes: 15,
  minutesToday: 0,
  percent: 0,
  lessonsTouchedToday: 0,
  completedToday: 0,
  ...overrides,
});

const continueLesson = (overrides: Partial<ContinueLesson> = {}): ContinueLesson => ({
  lessonSlug: 'lesson-1',
  lessonTitle: 'Greetings',
  lessonTitleAr: 'التحيات',
  courseSlug: 'course-1',
  courseTitle: 'Foundations',
  courseTitleAr: 'الأساسيات',
  courseEmoji: '📘',
  percent: 40,
  updatedAt: '2026-11-04T10:00:00.000Z',
  ...overrides,
});

const achievement = (overrides: Partial<AchievementView>): AchievementView => ({
  id: 'firstLesson',
  emoji: '🌱',
  unlocked: false,
  current: 0,
  target: 1,
  percent: 0,
  ...overrides,
});

describe('DailyGoalCard', () => {
  it('shows minutes against the goal with the progress percent', () => {
    render(<DailyGoalCard progress={dailyProgress({ minutesToday: 10, percent: 67 })} dict={dict} />);
    expect(screen.getByText('هدف اليوم')).toBeInTheDocument();
    expect(screen.getByText('10 من 15 دقيقة')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('celebrates when the goal is reached', () => {
    render(<DailyGoalCard progress={dailyProgress({ minutesToday: 20, percent: 100 })} dict={dict} />);
    expect(screen.getByText('أكملت هدف اليوم! 🎉')).toBeInTheDocument();
  });

  it('labels today lesson counts', () => {
    render(
      <DailyGoalCard
        progress={dailyProgress({ lessonsTouchedToday: 2, completedToday: 1 })}
        dict={dict}
      />,
    );
    expect(screen.getByText('2 دروس اليوم · 1 مكتمل')).toBeInTheDocument();
  });
});

describe('ContinueLearningCard', () => {
  it('renders the resume CTA for the last in-progress lesson', () => {
    render(<ContinueLearningCard lesson={continueLesson()} dict={dict} />);
    expect(screen.getByText('تابع التعلّم')).toBeInTheDocument();
    expect(screen.getByText('التحيات')).toBeInTheDocument();
    expect(screen.getByText(/الأساسيات/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /تابع الدرس/ });
    expect(link).toHaveAttribute('href', '/courses/course-1/lessons/lesson-1');
  });

  it('falls back to the roadmap CTA when there is nothing to resume', () => {
    render(<ContinueLearningCard lesson={null} dict={dict} />);
    expect(screen.getByText('ابدأ رحلتك اليوم')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /افتح الخريطة/ });
    expect(link).toHaveAttribute('href', '/roadmap');
  });
});

describe('RoadmapTeaserCard', () => {
  const roadmap = (overrides: Partial<RoadmapData> = {}): RoadmapData => ({
    steps: [
      { level: 'foundation', totalLessons: 4, doneLessons: 4, courses: 1, stories: 0, quizzes: 0 },
      { level: 'a1', totalLessons: 6, doneLessons: 2, courses: 2, stories: 2, quizzes: 1 },
    ],
    nextLesson: {
      step: 'a1',
      courseSlug: 'course-1',
      courseTitle: 'Foundations',
      courseTitleAr: 'الأساسيات',
      courseEmoji: '📘',
      lessonSlug: 'lesson-2',
      lessonTitle: 'Lesson 2',
      lessonTitleAr: 'الدرس الثاني',
    },
    ...overrides,
  });

  it('folds foundation into a1 and links to the map', () => {
    render(<RoadmapTeaserCard data={roadmap()} dict={dict} />);
    expect(screen.getByText('خارطة التعلّم')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /افتح الخريطة/ })).toHaveAttribute('href', '/roadmap');
    // Foundation (4/4) folds into a1 → the a1 chip shows 6/10 (4+6 lessons,
    // 4+2 done) and no separate foundation chip exists.
    const a1Chip = screen.getByText('a1').closest('li');
    expect(a1Chip?.textContent).toContain('6/10');
    expect(screen.queryByText('foundation')).not.toBeInTheDocument();
    // Next lesson summary comes from real roadmap data.
    expect(screen.getByText(/الدرس الثاني/)).toBeInTheDocument();
  });

  it('handles a fully finished path without a next lesson', () => {
    render(
      <RoadmapTeaserCard
        data={roadmap({ steps: [], nextLesson: null })}
        dict={dict}
      />,
    );
    expect(screen.getByText('أكملت ما هو متاح من المسار — بانتظار محتوى جديد.')).toBeInTheDocument();
  });
});

describe('AchievementsStrip', () => {
  it('renders unlocked badges first with the counter', () => {
    render(
      <AchievementsStrip
        items={[
          achievement({ id: 'firstLesson', unlocked: true, current: 1, percent: 100 }),
          achievement({ id: 'points500', current: 250, target: 500, percent: 50 }),
        ]}
        unlockedCount={1}
        dict={dict}
      />,
    );
    expect(screen.getByText('الإنجازات')).toBeInTheDocument();
    expect(screen.getByText('1 من 2 شارة')).toBeInTheDocument();
    expect(screen.getByText('الخطوة الأولى')).toBeInTheDocument();
    // Locked badge shows its lock hint.
    expect(screen.getByText(/مقفلة/)).toBeInTheDocument();
    // Progress bars expose their badge names.
    expect(screen.getByRole('progressbar', { name: 'الخطوة الأولى' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: '500 نقطة' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });
});
