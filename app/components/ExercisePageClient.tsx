'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useWorkoutData } from '../context/WorkoutDataContext';
import ExerciseDetail from './ExerciseDetail';
import CardioExerciseDetail from './CardioExerciseDetail';
import NavBar from './NavBar';

interface ExercisePageClientProps {
  exerciseId: string;
}

export default function ExercisePageClient({ exerciseId }: ExercisePageClientProps) {
  const {
    loading,
    lastFetched,
    fetchAllData,
    getExerciseById,
    getExerciseSets,
    getLastSetExcludingToday,
    getPersonalRecords,
  } = useWorkoutData();

  // Ensure data is loaded
  useEffect(() => {
    if (!lastFetched) {
      fetchAllData();
    }
  }, [lastFetched, fetchAllData]);

  const exercise = getExerciseById(exerciseId);
  const sets = getExerciseSets(exerciseId);
  const lastSet = getLastSetExcludingToday(exerciseId);
  const prs = getPersonalRecords(exerciseId);

  // Show loading while data is being fetched
  if (loading && !lastFetched) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading exercise...</p>
          </div>
        </div>
      </div>
    );
  }

  // Exercise not found
  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exercises
          </Link>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Exercise not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:text-gray-900 dark:active:text-white transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Exercises
        </Link>
      </div>

      {/* Exercise Detail Component */}
      {exercise.exercise_type === 'cardio' ? (
        <CardioExerciseDetail
          exercise={exercise}
          initialSets={sets}
          lastSet={lastSet}
        />
      ) : (
        <ExerciseDetail
          exercise={exercise}
          initialSets={sets}
          initialPRs={prs}
          lastSet={lastSet}
        />
      )}
    </div>
  );
}
