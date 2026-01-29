'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Exercise, WorkoutSet } from '@/lib/types';
import { ChevronRight, Plus, Pin, StickyNote, Target } from 'lucide-react';
import { getPrimaryMuscleGroup, getMuscleGroups } from '@/lib/muscle-utils';

interface ExerciseCardProps {
  exercise: Exercise;
  topSetLastSession: WorkoutSet | null;
  lastSet: WorkoutSet | null;
  currentMax: number | null;
  lastSessionNotes: string | null;
  onSetLogged?: () => void;
}

// Text colors for each muscle group label (darker/gentler shades)
const getMuscleGroupTextColor = (muscleGroup: string) => {
  const colors: Record<string, string> = {
    Chest: 'text-rose-700 dark:text-rose-300',
    Back: 'text-blue-600 dark:text-blue-400',
    Legs: 'text-green-700 dark:text-green-300',
    Shoulders: 'text-amber-700 dark:text-amber-300',
    Arms: 'text-purple-600 dark:text-purple-400',
    Biceps: 'text-violet-600 dark:text-violet-400',
    Triceps: 'text-fuchsia-600 dark:text-fuchsia-400',
    Core: 'text-yellow-700 dark:text-yellow-300',
    Cardio: 'text-teal-600 dark:text-teal-400',
  };
  return colors[muscleGroup] || 'text-gray-600 dark:text-gray-400';
};

// Background and text colors for PR box matching muscle group
const getMuscleGroupPRColors = (muscleGroup: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    Chest: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300' },
    Back: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    Legs: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
    Shoulders: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
    Arms: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    Biceps: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
    Triceps: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
    Core: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300' },
    Cardio: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
  };
  return colors[muscleGroup] || { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400' };
};

// Get user's timezone or default to PST
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
};

// Create a date string that preserves the user's local time
const getLocalDateISO = () => {
  const now = new Date();
  const timezone = getUserTimezone();

  // Get the date parts in user's timezone
  const year = now.toLocaleString('en-US', { year: 'numeric', timeZone: timezone });
  const month = now.toLocaleString('en-US', { month: '2-digit', timeZone: timezone });
  const day = now.toLocaleString('en-US', { day: '2-digit', timeZone: timezone });
  const hour = now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: timezone }).padStart(2, '0');
  const minute = now.toLocaleString('en-US', { minute: '2-digit', timeZone: timezone }).padStart(2, '0');
  const second = now.toLocaleString('en-US', { second: '2-digit', timeZone: timezone }).padStart(2, '0');

  // Return ISO format with the local time (stored as if it were UTC, but representing local time)
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
};

// Format weight display for body weight vs regular exercises
const formatWeight = (weight: number, usesBodyWeight: boolean): string => {
  if (!usesBodyWeight) {
    return `${weight}`;
  }
  return weight > 0 ? `BW + ${weight}` : 'BW';
};

export default function ExerciseCard({ exercise, topSetLastSession, lastSet, currentMax, lastSessionNotes, onSetLogged }: ExerciseCardProps) {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation to detail page

    // For bodyweight exercises, weight can be 0; for regular exercises, weight must be > 0
    if (!exercise.uses_body_weight && weight <= 0) return;
    if (reps <= 0) return;

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
          date: getLocalDateISO(),
        }),
      });

      if (!response.ok) throw new Error('Failed to log set');

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset form fields
      setWeight(0);
      setReps(0);

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

  const primaryMuscle = getPrimaryMuscleGroup(exercise);
  const muscleGroupColor = getMuscleGroupTextColor(primaryMuscle);
  const prColors = getMuscleGroupPRColors(primaryMuscle);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Clickable to detail page */}
      <Link href={`/exercise/${exercise.id}`}>
        <div className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold pr-2 text-gray-900 dark:text-white">
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {exercise.uses_body_weight ? (
                // Goal Reps for body weight exercises
                exercise.goal_reps && (
                  <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                    currentMax && currentMax >= exercise.goal_reps
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Target className="w-3 h-3" />
                    Goal: {exercise.goal_reps} reps
                  </span>
                )
              ) : (
                // Goal Weight for strength exercises
                exercise.goal_weight && (
                  <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                    currentMax && currentMax >= exercise.goal_weight
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Target className="w-3 h-3" />
                    Goal: {exercise.goal_weight}
                  </span>
                )
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {getMuscleGroups(exercise).map((mg, index) => (
              <span
                key={mg}
                className={`text-xs sm:text-sm font-medium ${
                  index === 0 ? getMuscleGroupTextColor(mg) : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {mg}{index < getMuscleGroups(exercise).length - 1 ? ' •' : ''}
              </span>
            ))}
            {(exercise.pinned_note || lastSessionNotes) && (
              <span className={`text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded flex items-center gap-1 ${exercise.pinned_note ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 font-medium' : `${prColors.bg} ${prColors.text}`}`}>
                {exercise.pinned_note ? <Pin className="w-2.5 h-2.5 flex-shrink-0" /> : <StickyNote className="w-2.5 h-2.5 flex-shrink-0" />}
                {exercise.pinned_note || lastSessionNotes}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Stats Section */}
      <div className="px-4 sm:px-5 pb-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {/* Top Set Last Session */}
          <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-md">
            <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              Last Session
            </div>
            {topSetLastSession ? (
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {formatWeight(topSetLastSession.weight ?? 0, exercise.uses_body_weight)} × {topSetLastSession.reps}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-400">-</div>
            )}
          </div>

          {/* Last Set */}
          <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-md">
            <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              Last Set
            </div>
            {lastSet ? (
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {formatWeight(lastSet.weight ?? 0, exercise.uses_body_weight)} × {lastSet.reps}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-400">-</div>
            )}
          </div>

          {/* PR */}
          <div className={`${prColors.bg} p-2 sm:p-3 rounded-md`}>
            <div className={`text-[9px] sm:text-[10px] ${prColors.text} mb-1 font-medium`}>
              {exercise.default_pr_reps}RM PR
            </div>
            {currentMax !== null ? (
              <div className={`text-xs sm:text-sm font-bold ${prColors.text}`}>
                {formatWeight(currentMax, exercise.uses_body_weight)} lbs
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-400">-</div>
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
          {!exercise.uses_body_weight && (
            <>
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
              <span className="flex items-center text-gray-400 text-sm">×</span>
            </>
          )}
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={reps || ''}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className={`${exercise.uses_body_weight ? 'flex-1' : 'w-16 sm:w-20'} px-2 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={isSubmitting || (!exercise.uses_body_weight && weight <= 0) || reps <= 0}
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
