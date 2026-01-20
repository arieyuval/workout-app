'use client';

import { useState, useEffect } from 'react';
import type { Exercise, WorkoutSet, PersonalRecord } from '@/lib/types';
import { format } from 'date-fns';
import SetLogForm from './SetLogForm';
import HistoryTable from './HistoryTable';
import PRList from './PRList';
import ProgressChart from './ProgressChart';
import { useWorkoutData } from '../context/WorkoutDataContext';

// Format weight display for body weight vs regular exercises
const formatWeight = (weight: number, usesBodyWeight: boolean): string => {
  if (!usesBodyWeight) {
    return `${weight} lbs`;
  }
  return weight > 0 ? `BW + ${weight} lbs` : 'BW';
};

interface ExerciseDetailProps {
  exercise: Exercise;
  initialSets: WorkoutSet[];
  initialPRs: PersonalRecord[];
  lastSet: WorkoutSet | null;
}

export default function ExerciseDetail({
  exercise,
  initialSets,
  initialPRs,
  lastSet,
}: ExerciseDetailProps) {
  const { refreshExerciseSets } = useWorkoutData();
  const [sets, setSets] = useState<WorkoutSet[]>(initialSets);
  const [prs, setPRs] = useState<PersonalRecord[]>(initialPRs);
  const [selectedRepMax, setSelectedRepMax] = useState<number | ''>(exercise.default_pr_reps);
  const [currentMax, setCurrentMax] = useState<number | null>(null);
  const [defaultPrReps, setDefaultPrReps] = useState<number | ''>(exercise.default_pr_reps);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);

  // Fetch current max for selected rep count
  useEffect(() => {
    async function fetchMax() {
      try {
        const repMax = typeof selectedRepMax === 'number' ? selectedRepMax : 0;
        const max = sets
          .filter((s) => s.reps !== undefined && s.reps >= repMax)
          .reduce((max, set) => Math.max(max, set.weight!), 0);
        setCurrentMax(max || null);
      } catch (error) {
        console.error('Error calculating max:', error);
      }
    }
    fetchMax();
  }, [selectedRepMax, sets]);

  const handleSetLogged = async () => {
    // Refresh sets and PRs
    try {
      const setsResponse = await fetch(`/api/sets?exercise_id=${exercise.id}`);
      const newSets = await setsResponse.json();
      setSets(newSets);

      // Also update the global cache so main page shows updated data
      await refreshExerciseSets(exercise.id);

      // Recalculate PRs
      const repRanges = [1, 3, 5, 8, 10];
      const newPRs: PersonalRecord[] = [];

      for (const reps of repRanges) {
        const maxSet = newSets
          .filter((s: WorkoutSet) => s.reps !== undefined && s.reps >= reps)
          .reduce((max: WorkoutSet | null, set: WorkoutSet) =>
            !max || (set.weight !== undefined && max.weight !== undefined && set.weight > max.weight) ? set : max
          , null);

        if (maxSet) {
          newPRs.push({
            reps,
            weight: maxSet.weight,
            date: maxSet.date,
          });
        }
      }

      setPRs(newPRs);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleUpdateDefaultPrReps = async (newReps: number | '') => {
    // Validate input
    if (newReps === '' || newReps < 1 || newReps > 50 || !Number.isInteger(newReps)) {
      return;
    }

    setIsUpdatingDefault(true);
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_pr_reps: newReps,
        }),
      });

      if (!response.ok) throw new Error('Failed to update default PR reps');

      setDefaultPrReps(newReps);
      // Optionally trigger a page refresh or notify parent component
    } catch (error) {
      console.error('Error updating default PR reps:', error);
    } finally {
      setIsUpdatingDefault(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {exercise.name}
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            {exercise.muscle_group}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Card PR:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="50"
                value={defaultPrReps}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (value === '' || !isNaN(value)) {
                    setDefaultPrReps(value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (value !== '' && !isNaN(value) && value !== exercise.default_pr_reps) {
                    handleUpdateDefaultPrReps(value);
                  }
                }}
                disabled={isUpdatingDefault}
                className="w-14 px-2 py-1 text-xs sm:text-sm text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 touch-manipulation"
                placeholder="0"
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                RM
              </span>
            </div>
            {isUpdatingDefault && (
              <span className="text-xs text-gray-400">Updating...</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Last Set */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Last Set (excluding today)
          </h3>
          {lastSet ? (
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatWeight(lastSet.weight ?? 0, exercise.uses_body_weight)} × {lastSet.reps}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(lastSet.date), 'MMMM d, yyyy')}
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No previous sets</div>
          )}
        </div>

        {/* Max Weight Selector */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Personal Record
          </h3>
          <div className="flex items-end gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Rep Max
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="50"
                  value={selectedRepMax}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseInt(e.target.value);
                    if (value === '' || (!isNaN(value) && value >= 0 && value <= 50)) {
                      setSelectedRepMax(value);
                    }
                  }}
                  className="w-16 px-3 py-2 text-sm sm:text-base text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                  placeholder="0"
                />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  RM
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {currentMax ? formatWeight(currentMax, exercise.uses_body_weight) : 'No data'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log New Set Form */}
      <div className="mb-6 sm:mb-8">
        <SetLogForm exerciseId={exercise.id} usesBodyWeight={exercise.uses_body_weight} onSuccess={handleSetLogged} />
      </div>

      {/* Personal Records */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Personal Records
        </h2>
        <PRList records={prs} usesBodyWeight={exercise.uses_body_weight} />
      </div>

      {/* Progress Chart */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Progress Over Time
        </h2>
        <ProgressChart sets={sets} />
      </div>

      {/* History Table */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Set History
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <HistoryTable
            sets={sets}
            usesBodyWeight={exercise.uses_body_weight}
            onSetUpdated={handleSetLogged}
            onSetDeleted={handleSetLogged}
          />
        </div>
      </div>
    </div>
  );
}
