'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Exercise, WorkoutSet } from '@/lib/types';
import { ChevronRight, Plus } from 'lucide-react';

interface CardioExerciseCardProps {
  exercise: Exercise;
  lastSet: WorkoutSet | null;
  bestDistance: number | null;
  onSetLogged?: () => void;
}

export default function CardioExerciseCard({ exercise, lastSet, bestDistance, onSetLogged }: CardioExerciseCardProps) {
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation to detail page

    if (distance <= 0 || duration <= 0) return;

    setIsSubmitting(true);

    try {
      const payload = {
        exercise_id: exercise.id,
        distance,
        duration,
        date: new Date().toISOString(),
      };
      console.log('Quick logging cardio set:', payload);

      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quick log API error:', errorData);
        throw new Error(errorData.error || 'Failed to log set');
      }

      const result = await response.json();
      console.log('Quick log success:', result);

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset form fields
      setDistance(0);
      setDuration(0);

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
          {/* Last Session */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
              Last Session
            </div>
            {lastSet ? (
              <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {lastSet.distance} mi / {lastSet.duration} min
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>

          {/* Best Distance */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mb-1 font-medium">
              Best Distance
            </div>
            {bestDistance ? (
              <div className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                {bestDistance} mi
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
            inputMode="decimal"
            step="0.01"
            placeholder="Distance"
            value={distance || ''}
            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
            className="w-20 sm:w-24 px-2 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="flex items-center text-gray-400 text-sm">/</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Min"
            value={duration || ''}
            onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
            className="w-20 sm:w-24 px-2 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={isSubmitting || distance <= 0 || duration <= 0}
            className={`px-3 sm:px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center gap-1 flex-shrink-0 text-white ${
              showSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {showSuccess ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-sm">{showSuccess ? 'Done' : 'Add'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
