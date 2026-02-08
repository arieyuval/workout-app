'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import CardioExerciseCard from './CardioExerciseCard';
import type { ExerciseWithUserData, WorkoutSet } from '@/lib/types';

interface WorkoutSectionProps {
  title: string;
  exercises: ExerciseWithUserData[];
  sets: Record<string, WorkoutSet[]>;
  defaultExpanded?: boolean;
  getTopSetLastSession: (exerciseId: string) => WorkoutSet | null;
  getLastSet: (exerciseId: string) => WorkoutSet | null;
  getLastSessionNotes: (exerciseId: string) => string | null;
  getCurrentMax: (exerciseId: string, minReps: number) => number | null;
  getBestDistance: (exerciseId: string) => number | null;
  onSetLogged: (exerciseId: string) => void;
}

export default function WorkoutSection({
  title,
  exercises,
  sets,
  defaultExpanded = true,
  getTopSetLastSession,
  getLastSet,
  getLastSessionNotes,
  getCurrentMax,
  getBestDistance,
  onSetLogged,
}: WorkoutSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Sort exercises by set count (most logged first)
  const sortedExercises = [...exercises].sort((a, b) => {
    const aSets = sets[a.id]?.length || 0;
    const bSets = sets[b.id]?.length || 0;
    return bSets - aSets;
  });

  if (exercises.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 mb-3 px-1 group touch-manipulation"
      >
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({exercises.length})
        </span>
      </button>

      {/* Exercise Grid */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedExercises.map((exercise) => {
            if (exercise.exercise_type === 'cardio') {
              return (
                <CardioExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  lastSet={getLastSet(exercise.id)}
                  bestDistance={getBestDistance(exercise.id)}
                  lastSessionNotes={getLastSessionNotes(exercise.id)}
                  onSetLogged={() => onSetLogged(exercise.id)}
                />
              );
            } else {
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  topSetLastSession={getTopSetLastSession(exercise.id)}
                  lastSet={getLastSet(exercise.id)}
                  currentMax={getCurrentMax(exercise.id, exercise.user_pr_reps ?? 3)}
                  lastSessionNotes={getLastSessionNotes(exercise.id)}
                  onSetLogged={() => onSetLogged(exercise.id)}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
