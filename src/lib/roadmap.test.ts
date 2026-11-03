// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  ROADMAP_STEPS,
  buildRoadmap,
  foldToStep,
  type RoadmapLevelCounts,
} from './roadmap';

function counts(spec: Partial<Record<string, [number, number]>>) {
  const out: Partial<Record<(typeof ROADMAP_STEPS)[number], RoadmapLevelCounts>> = {};
  for (const [step, pair] of Object.entries(spec)) {
    if (!pair) continue;
    const [total, done] = pair;
    out[step as (typeof ROADMAP_STEPS)[number]] = { total, done };
  }
  return out;
}

describe('foldToStep', () => {
  it('folds foundation into A1 and keeps CEFR codes as-is', () => {
    expect(foldToStep('foundation')).toBe('a1');
    expect(foldToStep('a1')).toBe('a1');
    expect(foldToStep('a2')).toBe('a2');
    expect(foldToStep('c1')).toBe('c1');
  });
});

describe('buildRoadmap — empty platform', () => {
  it('marks every step empty with no current step', () => {
    const plan = buildRoadmap({});
    expect(plan.hasContent).toBe(false);
    expect(plan.currentStep).toBeNull();
    expect(plan.overallPercent).toBe(0);
    expect(plan.allCompleted).toBe(false);
    expect(plan.nodes.every((node) => node.status === 'empty')).toBe(true);
  });
});

describe('buildRoadmap — fresh learner', () => {
  it('starts at the first step that has content', () => {
    const plan = buildRoadmap(counts({ a1: [20, 0], a2: [10, 0] }));
    expect(plan.hasContent).toBe(true);
    expect(plan.currentStep).toBe('a1');
    const a1 = plan.nodes[0];
    expect(a1.status).toBe('upcoming');
    expect(a1.current).toBe(true);
    // a2 has content but is not current
    expect(plan.nodes[1].status).toBe('upcoming');
    expect(plan.nodes[1].current).toBe(false);
    // steps without content stay empty
    expect(plan.nodes[4].status).toBe('empty');
  });
});

describe('buildRoadmap — in progress', () => {
  it('keeps the learner on the partially completed step', () => {
    const plan = buildRoadmap(counts({ a1: [20, 5], a2: [10, 0] }));
    expect(plan.currentStep).toBe('a1');
    expect(plan.nodes[0].status).toBe('in_progress');
    expect(plan.nodes[0].percent).toBe(25);
    expect(plan.overallPercent).toBe(Math.round((5 / 30) * 100));
  });
});

describe('buildRoadmap — advancing', () => {
  it('moves the marker to the next step once the current one is complete', () => {
    const plan = buildRoadmap(counts({ a1: [20, 20], a2: [10, 0], b1: [8, 0] }));
    expect(plan.nodes[0].status).toBe('completed');
    expect(plan.nodes[0].current).toBe(false);
    expect(plan.currentStep).toBe('a2');
    expect(plan.nodes[1].current).toBe(true);
  });

  it('ignores empty steps when advancing', () => {
    const plan = buildRoadmap(counts({ a1: [4, 4], a2: [0, 0], b1: [6, 0] }));
    expect(plan.currentStep).toBe('b1');
  });
});

describe('buildRoadmap — free jumping', () => {
  it('follows the furthest active step, not the first gap', () => {
    const plan = buildRoadmap(
      counts({ a1: [20, 2], a2: [15, 0], b1: [10, 3] }),
    );
    expect(plan.currentStep).toBe('b1');
    expect(plan.nodes[2].current).toBe(true);
  });

  it('keeps moving forward before backfilling earlier gaps', () => {
    // The learner is past B1 (completed): the marker advances to the next
    // step with content (B2) — the untouched A2 stays visible as a gap.
    const plan = buildRoadmap(
      counts({ a1: [10, 10], a2: [12, 0], b1: [6, 6], b2: [5, 0] }),
    );
    expect(plan.currentStep).toBe('b2');
    expect(plan.nodes[3].current).toBe(true);
    expect(plan.nodes[1].status).toBe('upcoming');
  });

  it('backfills earlier gaps only when nothing remains forward', () => {
    const plan = buildRoadmap(
      counts({ a1: [10, 10], a2: [12, 0], b1: [6, 6] }),
    );
    expect(plan.currentStep).toBe('a2');
  });
});

describe('buildRoadmap — completion', () => {
  it('detects the finished path and parks the marker on the last step', () => {
    const plan = buildRoadmap(
      counts({ a1: [4, 4], a2: [3, 3], b1: [2, 2], b2: [5, 5], c1: [1, 1] }),
    );
    expect(plan.allCompleted).toBe(true);
    expect(plan.overallPercent).toBe(100);
    expect(plan.currentStep).toBe('c1');
    expect(plan.nodes.every((node) => node.status === 'completed')).toBe(true);
  });

  it('does not claim completion while any step has unfinished lessons', () => {
    const plan = buildRoadmap(counts({ a1: [4, 4], a2: [3, 2] }));
    expect(plan.allCompleted).toBe(false);
    expect(plan.overallPercent).toBe(86); // 6/9
  });
});

describe('buildRoadmap — input hygiene', () => {
  it('clamps impossible counts and floors negatives', () => {
    const plan = buildRoadmap(counts({ a1: [10, 99], a2: [-5, -2] }));
    expect(plan.nodes[0].done).toBe(10);
    expect(plan.nodes[0].percent).toBe(100);
    expect(plan.nodes[1].total).toBe(0);
    expect(plan.nodes[1].status).toBe('empty');
  });
});
