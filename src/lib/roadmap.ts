/**
 * Sprint 3 — Learning Roadmap (خارطة التعلم).
 *
 * Pure path rules shared by the roadmap page and its tests. The learner walks
 * five visible CEFR steps in order; `foundation` courses fold into the A1 step
 * (the same rule as the unified level dictionary). Keeping this module free of
 * database imports makes the sequencing rules easy to test and impossible to
 * drift between the page, the queries and future endpoints.
 */
import type { Level } from './types';

/** The five visible CEFR steps, in learning order. */
export const ROADMAP_STEPS = ['a1', 'a2', 'b1', 'b2', 'c1'] as const;
export type RoadmapStep = (typeof ROADMAP_STEPS)[number];

export type RoadmapStatus = 'completed' | 'in_progress' | 'upcoming' | 'empty';

/** Collapse the six stored level values onto the five visible CEFR steps. */
export function foldToStep(level: Level): RoadmapStep {
  return level === 'foundation' ? 'a1' : (level as RoadmapStep);
}

export interface RoadmapLevelCounts {
  total: number;
  done: number;
}

export interface RoadmapNode {
  step: RoadmapStep;
  total: number;
  done: number;
  percent: number;
  status: RoadmapStatus;
  current: boolean;
}

export interface RoadmapPlan {
  nodes: RoadmapNode[];
  currentStep: RoadmapStep | null;
  overallPercent: number;
  allCompleted: boolean;
  hasContent: boolean;
}

function safePercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/**
 * Builds the visual path from raw per-step lesson counts.
 *
 * Rules:
 *  - A step without published lessons is `empty` (rendered as «قريبًا»).
 *  - `completed` once every lesson of the step is done.
 *  - `in_progress` when at least one lesson is done but not all.
 *  - `upcoming` for untouched steps that still have lessons.
 *  - `current` flags the single step the learner should be working on:
 *      1. the last step that shows any activity, unless it is already
 *         completed — then the next step that still has lessons;
 *      2. if that fails, the first step with content that is not completed;
 *      3. with no activity at all, the first step that has lessons.
 */
export function buildRoadmap(
  counts: Partial<Record<RoadmapStep, RoadmapLevelCounts>>,
): RoadmapPlan {
  const nodes: RoadmapNode[] = ROADMAP_STEPS.map((step) => {
    const raw = counts[step] ?? { total: 0, done: 0 };
    const total = Math.max(0, Math.floor(raw.total));
    const done = Math.min(Math.max(0, Math.floor(raw.done)), total);
    const status: RoadmapStatus =
      total === 0
        ? 'empty'
        : done >= total
          ? 'completed'
          : done > 0
            ? 'in_progress'
            : 'upcoming';
    return { step, total, done, percent: safePercent(done, total), status, current: false };
  });

  const hasContent = nodes.some((node) => node.total > 0);
  const grandTotal = nodes.reduce((sum, node) => sum + node.total, 0);
  const grandDone = nodes.reduce((sum, node) => sum + node.done, 0);
  const allCompleted = hasContent && grandDone >= grandTotal;

  let currentIndex = -1;
  if (hasContent) {
    const activeIndexes = nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => node.done > 0);

    if (activeIndexes.length === 0) {
      // No lesson activity yet: start the learner at the first step with content.
      currentIndex = nodes.findIndex((node) => node.total > 0);
    } else {
      const last = activeIndexes[activeIndexes.length - 1];
      if (last.node.status !== 'completed') {
        currentIndex = last.index;
      } else {
        currentIndex = nodes.findIndex(
          (node, index) => index > last.index && node.total > 0,
        );
        if (currentIndex === -1) {
          // The furthest active step is done: fall back to the first
          // unfinished step (earlier gaps take the learner back).
          currentIndex = nodes.findIndex(
            (node) => node.total > 0 && node.status !== 'completed',
          );
        }
        if (currentIndex === -1 && allCompleted) {
          // Everything is finished: keep the marker on the final step.
          currentIndex = last.index;
        }
      }
    }
  }
  if (currentIndex >= 0) nodes[currentIndex].current = true;

  return {
    nodes,
    currentStep: currentIndex >= 0 ? nodes[currentIndex].step : null,
    overallPercent: safePercent(grandDone, grandTotal),
    allCompleted,
    hasContent,
  };
}
