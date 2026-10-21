import { describe, expect, it } from 'vitest';
import {
  lessonProgressSchema,
  loginSchema,
  registerSchema,
  reviewSchema,
  roleSchema,
  storyAttemptSchema,
} from './validation';

describe('registerSchema', () => {
  it('trims, lowercases and normalises a valid registration', () => {
    const parsed = registerSchema.parse({
      name: '  Sara  ',
      email: '  Sara@Example.COM ',
      password: 'supersecret',
    });
    expect(parsed.name).toBe('Sara');
    expect(parsed.email).toBe('sara@example.com');
  });

  it('rejects short names, bad emails and short passwords', () => {
    expect(registerSchema.safeParse({ name: 'S', email: 'a@b.co', password: 'longenough' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Sara', email: 'nope', password: 'longenough' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Sara', email: 'a@b.co', password: 'short' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('reviewSchema', () => {
  it('only allows the four SRS grades', () => {
    for (const grade of ['again', 'hard', 'good', 'easy']) {
      expect(reviewSchema.safeParse({ vocabId: 'v1', grade }).success).toBe(true);
    }
    expect(reviewSchema.safeParse({ vocabId: 'v1', grade: 'perfect' }).success).toBe(false);
  });
});

describe('storyAttemptSchema', () => {
  it('bounds the number and range of answers', () => {
    expect(storyAttemptSchema.safeParse({ storyId: 's1', answers: [0, 1, 2] }).success).toBe(true);
    expect(storyAttemptSchema.safeParse({ storyId: 's1', answers: [-1] }).success).toBe(false);
    expect(storyAttemptSchema.safeParse({ storyId: 's1', answers: Array(51).fill(0) }).success).toBe(false);
  });
});

describe('lessonProgressSchema', () => {
  it('rejects impossible positions and percentages', () => {
    expect(
      lessonProgressSchema.safeParse({ lessonId: 'l1', positionSeconds: 12, percent: 50 }).success,
    ).toBe(true);
    expect(
      lessonProgressSchema.safeParse({ lessonId: 'l1', positionSeconds: -1, percent: 50 }).success,
    ).toBe(false);
    expect(
      lessonProgressSchema.safeParse({ lessonId: 'l1', positionSeconds: 1, percent: 150 }).success,
    ).toBe(false);
  });
});

describe('roleSchema', () => {
  it('restricts roles to the known set', () => {
    expect(roleSchema.safeParse({ userId: 'u1', role: 'ADMIN' }).success).toBe(true);
    expect(roleSchema.safeParse({ userId: 'u1', role: 'SUPERUSER' }).success).toBe(false);
  });
});
