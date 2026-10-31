// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { normaliseDescription, titleIssues } from './clean-lesson-text';

describe('normaliseDescription (P2.5)', () => {
  it('strips leading and trailing blank lines', () => {
    expect(normaliseDescription('\n\n\nHello world\n\n\n')).toBe('Hello world');
  });

  it('collapses runs of blank lines to a single blank line', () => {
    expect(normaliseDescription('A\n\n\n\n\nB')).toBe('A\n\nB');
  });

  it('strips trailing whitespace per line and handles CRLF', () => {
    expect(normaliseDescription('Line one  \r\nLine two\t \r\n')).toBe('Line one\nLine two');
  });

  it('never touches already-clean text (idempotent, lossless)', () => {
    const clean = 'Welcome to the lesson.\n\nIn this video we practise the past tense.';
    expect(normaliseDescription(clean)).toBe(clean);
  });
});

describe('titleIssues (P2.6 — report only)', () => {
  it('flags edge and double spaces', () => {
    expect(titleIssues('  Spaced Out ')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'edge_space' }),
        expect.objectContaining({ kind: 'double_space' }),
      ]),
    );
  });

  it('flags trailing separators', () => {
    expect(titleIssues('Lesson 12 —')).toEqual([
      expect.objectContaining({ kind: 'trailing_separator' }),
    ]);
  });

  it('flags episode-suffix drift', () => {
    expect(titleIssues('Unit 3 Episode 7')).toEqual([
      expect.objectContaining({ kind: 'episode_suffix' }),
    ]);
  });

  it('accepts clean titles', () => {
    expect(titleIssues('Unit 3 · Asking for directions')).toEqual([]);
  });
});
