import type { WorkoutSet } from './types';

/**
 * Calculate the Strength Score (estimated 1RM) for a single set.
 * Uses Brzycki formula for 1-10 reps, Epley formula for 11+ reps.
 */
export function calculateStrengthScore(weight: number | undefined, reps: number | undefined): number | null {
  if (weight === undefined || reps === undefined || weight <= 0 || reps <= 0) {
    return null;
  }

  if (reps === 1) {
    return weight;
  }

  if (reps <= 10) {
    // Brzycki: Weight * (36 / (37 - Reps))
    return weight * (36 / (37 - reps));
  }

  // Epley: Weight * (1 + Reps / 30)
  return weight * (1 + reps / 30);
}

export interface StrengthScoreResult {
  score: number;
  weight: number;
  reps: number;
}

/**
 * Calculate strength score for a WorkoutSet, returning the score
 * along with the original weight and reps that produced it.
 */
export function getSetStrengthScore(set: WorkoutSet): StrengthScoreResult | null {
  const score = calculateStrengthScore(set.weight, set.reps);
  if (score === null || set.weight === undefined || set.reps === undefined) {
    return null;
  }
  return {
    score: Math.round(score * 10) / 10,
    weight: set.weight,
    reps: set.reps,
  };
}
