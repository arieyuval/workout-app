-- Workout Tracker Database Setup
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  default_pr_reps INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_date ON sets(date DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- Insert placeholder exercises
INSERT INTO exercises (name, muscle_group, default_pr_reps) VALUES
  -- Chest exercises
  ('Chest Exercise 1', 'Chest', 1),
  ('Chest Exercise 2', 'Chest', 1),
  ('Chest Exercise 3', 'Chest', 1),

  -- Back exercises
  ('Back Exercise 1', 'Back', 1),
  ('Back Exercise 2', 'Back', 1),
  ('Back Exercise 3', 'Back', 1),

  -- Legs exercises
  ('Legs Exercise 1', 'Legs', 1),
  ('Legs Exercise 2', 'Legs', 1),
  ('Legs Exercise 3', 'Legs', 1),

  -- Shoulders exercises
  ('Shoulders Exercise 1', 'Shoulders', 1),
  ('Shoulders Exercise 2', 'Shoulders', 1),
  ('Shoulders Exercise 3', 'Shoulders', 1),

  -- Arms exercises
  ('Arms Exercise 1', 'Arms', 1),
  ('Arms Exercise 2', 'Arms', 1),
  ('Arms Exercise 3', 'Arms', 1),

  -- Core exercises
  ('Core Exercise 1', 'Core', 5),
  ('Core Exercise 2', 'Core', 5),
  ('Core Exercise 3', 'Core', 5);

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
