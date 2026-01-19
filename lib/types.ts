// Core data types for the workout tracker app

export type MuscleGroup = 'All' | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
export type ExerciseType = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  exercise_type: ExerciseType;
  default_pr_reps: number; // default rep count for PR display (only for strength exercises)
  is_base: boolean; // true for base exercises shown to all users, false for user-created
  uses_body_weight: boolean; // true for exercises that use body weight (pull-ups, dips, etc.)
  created_at?: string;
}

export interface UserExercise {
  id: string;
  user_id: string;
  exercise_id: string;
  created_at?: string;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  user_id?: string;
  exercise_name?: string;
  // Strength training fields
  weight?: number;
  reps?: number;
  // Cardio fields
  distance?: number; // in miles or km
  duration?: number; // in minutes
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

// User profile for body weight tracking
export interface UserProfile {
  id: string;
  user_id: string;
  current_weight?: number;
  goal_weight?: number;
  created_at?: string;
  updated_at?: string;
}

// Body weight log entry
export interface BodyWeightLog {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  notes?: string;
  created_at?: string;
}

export type BodyWeightLogInsert = Omit<BodyWeightLog, 'id' | 'created_at'>;
