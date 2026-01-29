'use client';

import { useState, useEffect } from 'react';
import type { ExerciseWithUserData, WorkoutSet, PersonalRecord } from '@/lib/types';
import { format } from 'date-fns';
import { Pin, X, Check, Pencil, Trash2, Target } from 'lucide-react';
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
  exercise: ExerciseWithUserData;
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
  const { refreshExerciseSets, fetchAllData } = useWorkoutData();
  const [sets, setSets] = useState<WorkoutSet[]>(initialSets);
  const [prs, setPRs] = useState<PersonalRecord[]>(initialPRs);
  const [selectedRepMax, setSelectedRepMax] = useState<number | ''>(exercise.user_pr_reps);
  const [currentMax, setCurrentMax] = useState<number | null>(null);
  const [userPrReps, setDefaultPrReps] = useState<number | ''>(exercise.user_pr_reps);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);

  // Pinned note state
  const [pinnedNote, setPinnedNote] = useState<string>(exercise.pinned_note || '');
  const [isEditingPinnedNote, setIsEditingPinnedNote] = useState(false);
  const [pinnedNoteInput, setPinnedNoteInput] = useState<string>(exercise.pinned_note || '');
  const [isUpdatingPinnedNote, setIsUpdatingPinnedNote] = useState(false);

  // Goal weight state (for strength exercises)
  const [goalWeight, setGoalWeight] = useState<number | null>(exercise.goal_weight ?? null);
  const [goalWeightInput, setGoalWeightInput] = useState<string>(exercise.goal_weight?.toString() || '');
  const [isEditingGoalWeight, setIsEditingGoalWeight] = useState(false);
  const [isUpdatingGoalWeight, setIsUpdatingGoalWeight] = useState(false);

  // Goal reps state (for body weight exercises)
  const [goalReps, setGoalReps] = useState<number | null>(exercise.goal_reps ?? null);
  const [goalRepsInput, setGoalRepsInput] = useState<string>(exercise.goal_reps?.toString() || '');
  const [isEditingGoalReps, setIsEditingGoalReps] = useState(false);
  const [isUpdatingGoalReps, setIsUpdatingGoalReps] = useState(false);

  // Calculate max reps for body weight exercises
  const maxReps = exercise.uses_body_weight
    ? sets.reduce((max, set) => Math.max(max, set.reps ?? 0), 0) || null
    : null;

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
          user_pr_reps: newReps,
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

  const handleSavePinnedNote = async () => {
    setIsUpdatingPinnedNote(true);
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinned_note: pinnedNoteInput.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update pinned note');

      setPinnedNote(pinnedNoteInput.trim());
      setIsEditingPinnedNote(false);
      // Refresh global data so cards update
      await fetchAllData(true);
    } catch (error) {
      console.error('Error updating pinned note:', error);
    } finally {
      setIsUpdatingPinnedNote(false);
    }
  };

  const handleCancelPinnedNote = () => {
    setPinnedNoteInput(pinnedNote);
    setIsEditingPinnedNote(false);
  };

  const handleDeletePinnedNote = async () => {
    setIsUpdatingPinnedNote(true);
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinned_note: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to delete pinned note');

      setPinnedNote('');
      setPinnedNoteInput('');
      setIsEditingPinnedNote(false);
      // Refresh global data so cards update
      await fetchAllData(true);
    } catch (error) {
      console.error('Error deleting pinned note:', error);
    } finally {
      setIsUpdatingPinnedNote(false);
    }
  };

  const handleUpdateGoalWeight = async () => {
    setIsUpdatingGoalWeight(true);
    try {
      const newGoalWeight = goalWeightInput ? parseFloat(goalWeightInput) : null;
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_weight: newGoalWeight,
        }),
      });

      if (!response.ok) throw new Error('Failed to update goal weight');

      setGoalWeight(newGoalWeight);
      setIsEditingGoalWeight(false);
    } catch (error) {
      console.error('Error updating goal weight:', error);
    } finally {
      setIsUpdatingGoalWeight(false);
    }
  };

  const handleUpdateGoalReps = async () => {
    setIsUpdatingGoalReps(true);
    try {
      const newGoalReps = goalRepsInput ? parseInt(goalRepsInput) : null;
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_reps: newGoalReps,
        }),
      });

      if (!response.ok) throw new Error('Failed to update goal reps');

      setGoalReps(newGoalReps);
      setIsEditingGoalReps(false);
    } catch (error) {
      console.error('Error updating goal reps:', error);
    } finally {
      setIsUpdatingGoalReps(false);
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
                value={userPrReps}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (value === '' || !isNaN(value)) {
                    setDefaultPrReps(value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value);
                  if (value !== '' && !isNaN(value) && value !== exercise.user_pr_reps) {
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

        {/* Pinned Note Section */}
        <div className="mt-4">
          {isEditingPinnedNote ? (
            <div className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-amber-500 mt-2 flex-shrink-0" />
              <div className="flex-1">
                <input
                  type="text"
                  value={pinnedNoteInput}
                  onChange={(e) => setPinnedNoteInput(e.target.value)}
                  placeholder="Enter a pinned note..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                  disabled={isUpdatingPinnedNote}
                />
              </div>
              <button
                onClick={handleSavePinnedNote}
                disabled={isUpdatingPinnedNote}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md disabled:opacity-50"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelPinnedNote}
                disabled={isUpdatingPinnedNote}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              {pinnedNote && (
                <button
                  onClick={handleDeletePinnedNote}
                  disabled={isUpdatingPinnedNote}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : pinnedNote ? (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
              <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
                {pinnedNote}
              </span>
              <button
                onClick={() => setIsEditingPinnedNote(true)}
                className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded"
                title="Edit pinned note"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPinnedNote(true)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <Pin className="w-4 h-4" />
              Add pinned note
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

        {/* Goal (Weight for strength, Reps for body weight) */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            <Target className="w-4 h-4" />
            {exercise.uses_body_weight ? 'Goal Reps' : 'Goal Weight'}
          </div>
          {exercise.uses_body_weight ? (
            // Goal Reps UI for body weight exercises
            isEditingGoalReps ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={goalRepsInput}
                    onChange={(e) => setGoalRepsInput(e.target.value)}
                    className="w-24 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="reps"
                    autoFocus
                    disabled={isUpdatingGoalReps}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">reps</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateGoalReps}
                    disabled={isUpdatingGoalReps}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGoalReps(false);
                      setGoalRepsInput(goalReps?.toString() || '');
                    }}
                    disabled={isUpdatingGoalReps}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingGoalReps(true)}
                className="flex items-center gap-2 cursor-pointer group"
                title="Click to edit"
              >
                <span className={`text-2xl sm:text-3xl font-bold group-hover:underline ${
                  maxReps && goalReps && maxReps >= goalReps
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {goalReps ? `${goalReps} reps` : 'Set goal'}
                </span>
                <Pencil className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            )
          ) : (
            // Goal Weight UI for strength exercises
            isEditingGoalWeight ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={goalWeightInput}
                    onChange={(e) => setGoalWeightInput(e.target.value)}
                    className="w-24 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="lbs"
                    autoFocus
                    disabled={isUpdatingGoalWeight}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">lbs</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateGoalWeight}
                    disabled={isUpdatingGoalWeight}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGoalWeight(false);
                      setGoalWeightInput(goalWeight?.toString() || '');
                    }}
                    disabled={isUpdatingGoalWeight}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingGoalWeight(true)}
                className="flex items-center gap-2 cursor-pointer group"
                title="Click to edit"
              >
                <span className={`text-2xl sm:text-3xl font-bold group-hover:underline ${
                  currentMax && goalWeight && currentMax >= goalWeight
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {goalWeight ? `${goalWeight} lbs` : 'Set goal'}
                </span>
                <Pencil className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            )
          )}
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
        <ProgressChart sets={sets} usesBodyWeight={exercise.uses_body_weight} goalWeight={goalWeight} goalReps={goalReps} />
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
