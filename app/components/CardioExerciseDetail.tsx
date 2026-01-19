'use client';

import { useState } from 'react';
import type { Exercise, WorkoutSet } from '@/lib/types';
import { format } from 'date-fns';
import CardioSetLogForm from './CardioSetLogForm';
import CardioHistoryTable from './CardioHistoryTable';
import CardioPRList from './CardioPRList';
import CardioPaceChart from './CardioPaceChart';

interface CardioExerciseDetailProps {
  exercise: Exercise;
  initialSets: WorkoutSet[];
  lastSet: WorkoutSet | null;
}

export default function CardioExerciseDetail({
  exercise,
  initialSets,
  lastSet,
}: CardioExerciseDetailProps) {
  const [sets, setSets] = useState<WorkoutSet[]>(initialSets);

  const handleSetLogged = async () => {
    // Refresh sets
    try {
      const setsResponse = await fetch(`/api/sets?exercise_id=${exercise.id}`);
      const newSets = await setsResponse.json();
      setSets(newSets);
    } catch (error) {
      console.error('Error refreshing data:', error);
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
