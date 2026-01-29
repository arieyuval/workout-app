'use client';

import { useState } from 'react';
import type { ExerciseWithUserData, WorkoutSet } from '@/lib/types';
import { format } from 'date-fns';
import { Pin, X, Check, Pencil, Trash2 } from 'lucide-react';
import CardioSetLogForm from './CardioSetLogForm';
import CardioHistoryTable from './CardioHistoryTable';
import CardioPRList from './CardioPRList';
import CardioPaceChart from './CardioPaceChart';
import { useWorkoutData } from '../context/WorkoutDataContext';

interface CardioExerciseDetailProps {
  exercise: ExerciseWithUserData;
  initialSets: WorkoutSet[];
  lastSet: WorkoutSet | null;
}

export default function CardioExerciseDetail({
  exercise,
  initialSets,
  lastSet,
}: CardioExerciseDetailProps) {
  const { refreshExerciseSets, fetchAllData } = useWorkoutData();
  const [sets, setSets] = useState<WorkoutSet[]>(initialSets);

  // Pinned note state
  const [pinnedNote, setPinnedNote] = useState<string>(exercise.pinned_note || '');
  const [isEditingPinnedNote, setIsEditingPinnedNote] = useState(false);
  const [pinnedNoteInput, setPinnedNoteInput] = useState<string>(exercise.pinned_note || '');
  const [isUpdatingPinnedNote, setIsUpdatingPinnedNote] = useState(false);

  const handleSetLogged = async () => {
    // Refresh sets
    try {
      const setsResponse = await fetch(`/api/sets?exercise_id=${exercise.id}`);
      const newSets = await setsResponse.json();
      setSets(newSets);

      // Also update the global cache so main page shows updated data
      await refreshExerciseSets(exercise.id);
    } catch (error) {
      console.error('Error refreshing data:', error);
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

  // Calculate stats
  const totalSessions = sets.length;
  const totalDistance = sets.reduce((sum, set) => sum + (set.distance || 0), 0);
  const totalDuration = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
  const avgPace = totalDistance > 0 ? (totalDuration / totalDistance).toFixed(2) : null;

  // Calculate best pace
  const bestPace = sets.reduce((best, set) => {
    if (set.distance && set.duration && set.distance > 0) {
      const pace = set.duration / set.distance;
      return best === null || pace < best ? pace : best;
    }
    return best;
  }, null as number | null);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {exercise.name}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
          Cardio
        </p>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Last Session */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Last Session (excluding today)
          </h3>
          {lastSet && lastSet.distance && lastSet.duration ? (
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {lastSet.distance} mi in {lastSet.duration} min
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(lastSet.date), 'MMMM d, yyyy')}
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No previous sessions</div>
          )}
        </div>

        {/* Best Pace */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Best Pace
          </h3>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {bestPace ? `${bestPace.toFixed(2)} min/mi` : 'No data'}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Sessions
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalSessions}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Distance
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalDistance.toFixed(1)} mi
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Time
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalDuration.toFixed(0)} min
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Avg Pace
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {avgPace ? `${avgPace}` : '-'}
          </div>
          {avgPace && (
            <div className="text-xs text-gray-500 dark:text-gray-400">min/mi</div>
          )}
        </div>
      </div>

      {/* Log New Session Form */}
      <div className="mb-6 sm:mb-8">
        <CardioSetLogForm
          exerciseId={exercise.id}
          lastSet={
            lastSet?.distance && lastSet?.duration
              ? { distance: lastSet.distance, duration: lastSet.duration }
              : null
          }
          onSetLogged={handleSetLogged}
        />
      </div>

      {/* Personal Records */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Personal Records
        </h2>
        <CardioPRList sets={sets} />
      </div>

      {/* Pace Progress Chart */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Pace Over Time
        </h2>
        <CardioPaceChart sets={sets} />
      </div>

      {/* Session History */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Session History
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <CardioHistoryTable
            sets={sets}
            onSetUpdated={handleSetLogged}
            onSetDeleted={handleSetLogged}
          />
        </div>
      </div>
    </div>
  );
}
