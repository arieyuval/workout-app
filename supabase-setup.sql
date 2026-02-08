-- Workout Tracker Database Setup
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  exercise_type TEXT DEFAULT 'strength',
  default_pr_reps INTEGER DEFAULT 1,
  is_base BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_exercises junction table (tracks which exercises each user has added)
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Create sets table
CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  weight DECIMAL NOT NULL,
  reps INTEGER NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workouts table (user-defined exercise groupings)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_exercises junction table (exercises assigned to workouts)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_date ON sets(date DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_is_base ON exercises(is_base);
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercises_exercise_id ON user_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);

-- Insert base exercises (shown to all users)
INSERT INTO exercises (name, muscle_group, exercise_type, default_pr_reps, is_base) VALUES
  -- Chest exercises
  ('Bench Press', 'Chest', 'strength', 1, TRUE),
  ('Incline Dumbbell Press', 'Chest', 'strength', 1, TRUE),
  ('Cable Flyes', 'Chest', 'strength', 10, TRUE),

  -- Back exercises
  ('Deadlift', 'Back', 'strength', 1, TRUE),
  ('Barbell Row', 'Back', 'strength', 5, TRUE),
  ('Pull-ups', 'Back', 'strength', 8, TRUE),

  -- Legs exercises
  ('Squat', 'Legs', 'strength', 1, TRUE),
  ('Romanian Deadlift', 'Legs', 'strength', 8, TRUE),
  ('Leg Press', 'Legs', 'strength', 10, TRUE),

  -- Shoulders exercises
  ('Overhead Press', 'Shoulders', 'strength', 1, TRUE),
  ('Lateral Raises', 'Shoulders', 'strength', 12, TRUE),
  ('Face Pulls', 'Shoulders', 'strength', 15, TRUE),

  -- Arms exercises
  ('Barbell Curl', 'Arms', 'strength', 8, TRUE),
  ('Tricep Pushdown', 'Arms', 'strength', 10, TRUE),
  ('Hammer Curls', 'Arms', 'strength', 10, TRUE),

  -- Core exercises
  ('Plank', 'Core', 'strength', 1, TRUE),
  ('Cable Crunches', 'Core', 'strength', 15, TRUE),
  ('Hanging Leg Raises', 'Core', 'strength', 10, TRUE),

  -- Cardio exercises
  ('Running', 'Cardio', 'cardio', 1, TRUE),
  ('Cycling', 'Cardio', 'cardio', 1, TRUE),
  ('Rowing', 'Cardio', 'cardio', 1, TRUE);

-- Optional: Add some sample sets for testing (uncomment to use)
-- You can remove this section after testing
/*
DO $$
DECLARE
  chest_ex_id UUID;
BEGIN
  -- Get the ID of the first chest exercise
  SELECT id INTO chest_ex_id FROM exercises WHERE name = 'Chest Exercise 1' LIMIT 1;

  -- Insert some sample sets
  INSERT INTO sets (exercise_id, weight, reps, date, notes) VALUES
    (chest_ex_id, 135, 8, NOW() - INTERVAL '7 days', 'Felt strong'),
    (chest_ex_id, 140, 6, NOW() - INTERVAL '5 days', 'Good form'),
    (chest_ex_id, 145, 5, NOW() - INTERVAL '3 days', 'PR!'),
    (chest_ex_id, 145, 6, NOW() - INTERVAL '1 day', 'New PR for 6 reps');
END $$;
*/
