import { supabase } from './supabase';
import type { WorkoutSet, PersonalRecord, WorkoutSetInsert } from './types';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Get the most recent set for an exercise
 * @param exerciseId - The ID of the exercise
 * @param excludeToday - Whether to exclude today's sets (default: false)
 */
export async function getLastSet(
  exerciseId: string,
  excludeToday: boolean = false
): Promise<WorkoutSet | null> {
  let query = supabase
    .from('sets')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('date', { ascending: false })
    .limit(1);

  if (excludeToday) {
    const todayStart = startOfDay(new Date()).toISOString();
    query = query.lt('date', todayStart);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching last set:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Get the maximum weight for a given rep count (or more reps)
 * @param exerciseId - The ID of the exercise
 * @param reps - The minimum number of reps
 */
export async function getMaxForReps(
  exerciseId: string,
  reps: number
): Promise<number | null> {
  const { data, error } = await supabase
    .from('sets')
    .select('weight, reps')
    .eq('exercise_id', exerciseId)
    .gte('reps', reps)
    .order('weight', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching max for reps:', error);
    return null;
  }

  return data && data.length > 0 ? data[0].weight : null;
}

/**
 * Get personal records for common rep ranges
 * @param exerciseId - The ID of the exercise
 */
export async function getPersonalRecords(
  exerciseId: string
): Promise<PersonalRecord[]> {
  const repRanges = [1, 3, 5, 8, 10];
  const records: PersonalRecord[] = [];

  for (const reps of repRanges) {
    const { data, error } = await supabase
      .from('sets')
      .select('weight, reps, date')
      .eq('exercise_id', exerciseId)
      .gte('reps', reps)
      .order('weight', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      records.push({
        reps,
        weight: data[0].weight,
        date: data[0].date,
      });
    }
  }

  return records;
}

/**
 * Get the full set history for an exercise
 * @param exerciseId - The ID of the exercise
 */
export async function getSetHistory(exerciseId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching set history:', error);
    return [];
  }

  return data || [];
}

/**
 * Log a new set
 * @param setData - The set data to insert
 */
export async function logSet(setData: WorkoutSetInsert): Promise<WorkoutSet | null> {
  const { data, error } = await supabase
    .from('sets')
    .insert(setData)
    .select()
    .single();

  if (error) {
    console.error('Error logging set:', error);
    return null;
  }

  return data;
}

/**
 * Get all exercises, optionally filtered by muscle group
 * @param muscleGroup - Optional muscle group filter
 */
export async function getExercises(muscleGroup?: string) {
  let query = supabase.from('exercises').select('*').order('name');

  if (muscleGroup) {
    query = query.eq('muscle_group', muscleGroup);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single exercise by ID
 * @param exerciseId - The ID of the exercise
 */
export async function getExercise(exerciseId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) {
    console.error('Error fetching exercise:', error);
    return null;
  }

  return data;
}

/**
 * Update an exercise's default PR reps
 * @param exerciseId - The ID of the exercise
 * @param defaultPrReps - The new default PR rep count
 */
export async function updateExerciseDefaultPrReps(
  exerciseId: string,
  defaultPrReps: number
) {
  const { data, error } = await supabase
    .from('exercises')
    .update({ default_pr_reps: defaultPrReps })
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating exercise:', error);
    return null;
  }

  return data;
}
