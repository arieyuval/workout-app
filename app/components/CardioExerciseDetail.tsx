'use client';

import { useState } from 'react';
import type { Exercise, WorkoutSet } from '@/lib/types';
import CardioSetLogForm from './CardioSetLogForm';
import CardioHistoryTable from './CardioHistoryTable';
import CardioPRList from './CardioPRList';

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
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'prs'>('log');

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {exercise.name}
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
            Cardio
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Sessions
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalSessions}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Distance
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalDistance.toFixed(1)} mi
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Time
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalDuration.toFixed(0)} min
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
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

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 sm:gap-8 -mb-px">
          <button
            onClick={() => setActiveTab('log')}
            className={`pb-3 px-1 font-medium text-sm sm:text-base transition-colors border-b-2 ${
              activeTab === 'log'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Log Session
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-medium text-sm sm:text-base transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('prs')}
            className={`pb-3 px-1 font-medium text-sm sm:text-base transition-colors border-b-2 ${
              activeTab === 'prs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Personal Records
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'log' && (
          <CardioSetLogForm
            exerciseId={exercise.id}
            lastSet={
              lastSet?.distance && lastSet?.duration
                ? { distance: lastSet.distance, duration: lastSet.duration }
                : null
            }
            onSetLogged={handleSetLogged}
          />
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              Session History
            </h3>
            <CardioHistoryTable sets={sets} />
          </div>
        )}

        {activeTab === 'prs' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              Personal Records
            </h3>
            <CardioPRList sets={sets} />
          </div>
        )}
      </div>
    </div>
  );
}
