'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Exercise, WorkoutSet } from '@/lib/types';
import { ChevronRight, Plus } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  lastSet: WorkoutSet | null;
  currentMax: number | null;
  onSetLogged?: () => void;
}

export default function ExerciseCard({ exercise, lastSet, currentMax, onSetLogged }: ExerciseCardProps) {
  const [weight, setWeight] = useState(lastSet?.weight || 0);
  const [reps, setReps] = useState(lastSet?.reps || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation to detail page

    if (weight <= 0 || reps <= 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_id: exercise.id,
          weight,
          reps,
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to log set');

      // Call parent refresh function
      if (onSetLogged) {
        onSetLogged();
      }
    } catch (error) {
      console.error('Error logging set:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Clickable to detail page */}
      <Link href={`/exercise/${exercise.id}`}>
        <div className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pr-2">
              {exercise.name}
            </h3>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>

          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            {exercise.muscle_group}
          </div>
        </div>
      </Link>

      {/* Stats Section */}
      <div className="px-4 sm:px-5 pb-3 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Last Set */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
              Last Set (exlcluding today)
            </div>
            {lastSet ? (
              <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {lastSet.reps} × {lastSet.weight}
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>

          {/* PR */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
              {exercise.default_pr_reps}RM PR
            </div>
            {currentMax ? (
              <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                {currentMax} lbs
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Log Form */}
      <form onSubmit={handleQuickLog} onClick={(e) => e.stopPropagation()} className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Quick Log
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={reps || ''}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-16 sm:w-20 px-2 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex items-center text-gray-400 text-sm">×</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Wt"
            value={weight || ''}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="w-20 sm:w-24 px-2 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={isSubmitting || weight <= 0 || reps <= 0}
            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Add</span>
          </button>
        </div>
      </form>
    </div>
  );
}
