import type { Exercise, MuscleGroup } from './types';

/**
 * Normalize muscle_group to always return an array
 * Handles both string (legacy) and array (new) formats
 * @param exercise - The exercise to get muscle groups from
 * @returns Array of muscle groups
 */
export function getMuscleGroups(exercise: Exercise): MuscleGroup[] {
  if (Array.isArray(exercise.muscle_group)) {
    return exercise.muscle_group;
  }
  return [exercise.muscle_group];
}

/**
 * Get the primary muscle group (first in array, or the string value)
 * Used for color coding and display in "All" tab
 * @param exercise - The exercise to get primary muscle from
 * @returns Primary muscle group
 */
export function getPrimaryMuscleGroup(exercise: Exercise): MuscleGroup {
  if (Array.isArray(exercise.muscle_group)) {
    return exercise.muscle_group[0];
  }
  return exercise.muscle_group;
}

/**
 * Check if an exercise belongs to a muscle group tab
 * @param exercise - The exercise to check
 * @param tab - The muscle group tab to check against
 * @returns True if the exercise should appear in this tab
 */
export function exerciseMatchesMuscleTab(exercise: Exercise, tab: MuscleGroup): boolean {
  if (tab === 'All') return true;

  const muscleGroups = getMuscleGroups(exercise);

  // Handle special "Arms" tab that includes Biceps and Triceps
  if (tab === 'Arms') {
    return muscleGroups.some(mg => mg === 'Biceps' || mg === 'Triceps' || mg === 'Arms');
  }

  return muscleGroups.includes(tab);
}
