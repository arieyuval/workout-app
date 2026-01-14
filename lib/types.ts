// Core data types for the workout tracker app

export type MuscleGroup = 'All' | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  default_pr_reps: number; // default rep count for PR display
  created_at?: string;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  weight: number;
  reps: number;
  date: string; // ISO timestamp
  notes?: string;
  created_at?: string;
}

export interface PersonalRecord {
  reps: number;
  weight: number;
  date: string;
}

// Form data types
export interface SetFormData {
  weight: number;
  reps: number;
  notes?: string;
}

// Database insert types (without id and timestamps)
export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at'>;
export type WorkoutSetInsert = Omit<WorkoutSet, 'id' | 'created_at'>;
