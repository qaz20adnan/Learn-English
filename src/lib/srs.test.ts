import { describe, expect, it } from 'vitest';
import { GRADE_LABELS, initialState, isDue, schedule } from './srs';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-01-01T00:00:00.000Z');

describe('initialState', () => {
  it('starts with default ease and is due immediately', () => {
    const state = initialState(now);
    expect(state.ease).toBe(2.5);
    expect(state.repetitions).toBe(0);
    expect(state.intervalDays).toBe(0);
    expect(state.dueAt.getTime()).toBe(now.getTime());
  });
});

describe('schedule with "good"', () => {
  it('uses a one day interval on the first success', () => {
    const next = schedule(initialState(now), 'good', now);
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(next.dueAt.getTime()).toBe(now.getTime() + DAY);
  });

  it('jumps to three days on the second success', () => {
    const first = schedule(initialState(now), 'good', now);
    const second = schedule(first, 'good', now);
    expect(second.intervalDays).toBe(3);
    expect(second.repetitions).toBe(2);
  });

  it('scales by ease afterwards', () => {
    let state = schedule(initialState(now), 'good', now);
    state = schedule(state, 'good', now);
    const third = schedule(state, 'good', now);
    expect(third.intervalDays).toBe(Math.round(3 * 2.5));
  });
});

describe('schedule with "again"', () => {
  it('lapses, resets repetitions and schedules ten minutes later', () => {
    const next = schedule({ ease: 2.5, intervalDays: 10, repetitions: 4, lapses: 0 }, 'again', now);
    expect(next.repetitions).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.intervalDays).toBe(0);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.dueAt.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });

  it('never drops ease below 1.3', () => {
    const next = schedule({ ease: 1.4, intervalDays: 0, repetitions: 0, lapses: 0 }, 'again', now);
    expect(next.ease).toBe(1.3);
  });
});

describe('schedule with "hard" and "easy"', () => {
  it('keeps hard at a minimum of one day and lowers ease', () => {
    const next = schedule(initialState(now), 'hard', now);
    expect(next.intervalDays).toBe(1);
    expect(next.ease).toBeCloseTo(2.35);
  });

  it('rewards easy with a longer interval and higher ease', () => {
    const next = schedule(initialState(now), 'easy', now);
    expect(next.intervalDays).toBe(3);
    expect(next.ease).toBeCloseTo(2.65);
  });

  it('caps ease at 3.0', () => {
    const next = schedule({ ease: 2.95, intervalDays: 0, repetitions: 0, lapses: 0 }, 'easy', now);
    expect(next.ease).toBe(3.0);
  });
});

describe('isDue', () => {
  it('detects past and future due dates', () => {
    expect(isDue(new Date(now.getTime() - 1000), now)).toBe(true);
    expect(isDue(new Date(now.getTime() + 1000), now)).toBe(false);
    expect(isDue(now.toISOString(), now)).toBe(true);
  });
});

describe('GRADE_LABELS', () => {
  it('provides an Arabic label for every grade', () => {
    expect(Object.keys(GRADE_LABELS)).toEqual(['again', 'hard', 'good', 'easy']);
    for (const label of Object.values(GRADE_LABELS)) expect(label.length).toBeGreaterThan(0);
  });
});
