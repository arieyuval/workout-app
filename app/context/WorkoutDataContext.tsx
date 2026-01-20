'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { Exercise, WorkoutSet, PersonalRecord } from '@/lib/types';

interface WorkoutDataContextType {
  // State
  exercises: Exercise[];
  sets: Record<string, WorkoutSet[]>;
  loading: boolean;
  lastFetched: number | null;

  // Actions
  fetchAllData: (force?: boolean) => Promise<void>;
  refreshExerciseSets: (exerciseId: string) => Promise<void>;
  addExercise: (exercise: Exercise) => void;

  // Helper functions for derived data
  getExerciseById: (exerciseId: string) => Exercise | undefined;
  getExerciseSets: (exerciseId: string) => WorkoutSet[];
  getTopSetLastSession: (exerciseId: string) => WorkoutSet | null;
  getLastSet: (exerciseId: string) => WorkoutSet | null;
  getLastSetExcludingToday: (exerciseId: string) => WorkoutSet | null;
  getCurrentMax: (exerciseId: string, minReps: number) => number | null;
  getBestDistance: (exerciseId: string) => number | null;
  getPersonalRecords: (exerciseId: string) => PersonalRecord[];
}

const STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds

const WorkoutDataContext = createContext<WorkoutDataContextType | null>(null);

export function WorkoutDataProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Use ref to track in-flight requests and prevent duplicates
  const fetchInProgress = useRef(false);

  const fetchAllData = useCallback(async (force = false) => {
    // Skip if data is fresh and not forced
    if (!force && lastFetched && Date.now() - lastFetched < STALE_THRESHOLD_MS) {
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      setLoading(true);

      // Fetch exercises and bulk sets in parallel (2 requests instead of N+1)
      const [exercisesResponse, setsResponse] = await Promise.all([
        fetch('/api/exercises'),
        fetch('/api/sets/bulk'),
      ]);

      if (exercisesResponse.ok) {
        const exercisesData: Exercise[] = await exercisesResponse.json();
        setExercises(exercisesData);
      }

      if (setsResponse.ok) {
        const setsData: Record<string, WorkoutSet[]> = await setsResponse.json();
        setSets(setsData);
      }

      setLastFetched(Date.now());
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [lastFetched]);

  const refreshExerciseSets = useCallback(async (exerciseId: string) => {
    try {
      const response = await fetch(`/api/sets?exercise_id=${exerciseId}`);
      if (response.ok) {
        const exerciseSets = await response.json();
        setSets((prev) => ({
          ...prev,
          [exerciseId]: exerciseSets,
        }));
        // Update lastFetched to extend cache validity
        setLastFetched(Date.now());
      }
    } catch (error) {
      console.error('Error refreshing exercise sets:', error);
    }
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => [...prev, exercise]);
    setSets((prev) => ({ ...prev, [exercise.id]: [] }));
  }, []);

  // Helper: Get the top (heaviest) set from the last session (excluding today)
  const getTopSetLastSession = useCallback((exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to sets before today
    const previousSets = exerciseSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate < today;
    });

    if (previousSets.length === 0) return null;

    // Find the most recent date (last session)
    const lastSessionDate = new Date(previousSets[0].date);
    lastSessionDate.setHours(0, 0, 0, 0);

    // Get all sets from that day
    const lastSessionSets = previousSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate.getTime() === lastSessionDate.getTime();
    });

    // Find the set with the highest weight
    return lastSessionSets.reduce(
      (max, set) => ((set.weight ?? 0) > (max.weight ?? 0) ? set : max),
      lastSessionSets[0]
    );
  }, [sets]);

  // Helper: Get the most recent set logged (including today)
  const getLastSet = useCallback((exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    return exerciseSets.length > 0 ? exerciseSets[0] : null;
  }, [sets]);

  // Helper: Get current max for a given minimum rep count (strength exercises)
  const getCurrentMax = useCallback((exerciseId: string, minReps: number): number | null => {
    const exerciseSets = sets[exerciseId] || [];
    const validSets = exerciseSets.filter(
      (set) => set.reps !== undefined && set.reps >= minReps
    );

    if (validSets.length === 0) return null;

    return Math.max(...validSets.map((set) => set.weight!));
  }, [sets]);

  // Helper: Get best distance for cardio exercises
  const getBestDistance = useCallback((exerciseId: string): number | null => {
    const exerciseSets = sets[exerciseId] || [];
    const validSets = exerciseSets.filter(
      (set) => set.distance !== undefined && set.distance > 0
    );

    if (validSets.length === 0) return null;

    return Math.max(...validSets.map((set) => set.distance!));
  }, [sets]);

  // Helper: Get exercise by ID
  const getExerciseById = useCallback((exerciseId: string): Exercise | undefined => {
    return exercises.find((e) => e.id === exerciseId);
  }, [exercises]);

  // Helper: Get sets for a specific exercise
  const getExerciseSets = useCallback((exerciseId: string): WorkoutSet[] => {
    return sets[exerciseId] || [];
  }, [sets]);

  // Helper: Get last set excluding today (for "last session" display)
  const getLastSetExcludingToday = useCallback((exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const previousSets = exerciseSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate < today;
    });

    return previousSets.length > 0 ? previousSets[0] : null;
  }, [sets]);

  // Helper: Calculate personal records for an exercise
  const getPersonalRecords = useCallback((exerciseId: string): PersonalRecord[] => {
    const exerciseSets = sets[exerciseId] || [];
    const repRanges = [1, 3, 5, 8, 10];
    const records: PersonalRecord[] = [];

    for (const reps of repRanges) {
      const validSets = exerciseSets.filter(
        (s) => s.reps !== undefined && s.reps >= reps && s.weight !== undefined
      );

      if (validSets.length > 0) {
        const maxSet = validSets.reduce((max, set) =>
          (set.weight ?? 0) > (max.weight ?? 0) ? set : max
        );
        records.push({
          reps,
          weight: maxSet.weight!,
          date: maxSet.date,
        });
      }
    }

    return records;
  }, [sets]);

  return (
    <WorkoutDataContext.Provider
      value={{
        exercises,
        sets,
        loading,
        lastFetched,
        fetchAllData,
        refreshExerciseSets,
        addExercise,
        getExerciseById,
        getExerciseSets,
        getTopSetLastSession,
        getLastSet,
        getLastSetExcludingToday,
        getCurrentMax,
        getBestDistance,
        getPersonalRecords,
      }}
    >
      {children}
    </WorkoutDataContext.Provider>
  );
}

export function useWorkoutData() {
  const context = useContext(WorkoutDataContext);
  if (!context) {
    throw new Error('useWorkoutData must be used within a WorkoutDataProvider');
  }
  return context;
}
