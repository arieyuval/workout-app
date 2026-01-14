'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { MuscleGroup } from '@/lib/types';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: () => void;
}

const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function AddExerciseModal({ isOpen, onClose, onExerciseAdded }: AddExerciseModalProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [defaultPrReps, setDefaultPrReps] = useState<number | ''>('');
  const [prWeight, setPrWeight] = useState<number | ''>('');
  const [prReps, setPrReps] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!exerciseName.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (defaultPrReps === '' || defaultPrReps < 1 || defaultPrReps > 50) {
      setError('Default PR reps must be between 1 and 50');
      return;
    }

    // Validate PR inputs - both reps and weight must be provided together
    if ((prWeight !== '' && prReps === '') || (prWeight === '' && prReps !== '')) {
      setError('Please provide both reps and weight for the initial PR, or leave both empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the exercise
      const exerciseResponse = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exerciseName.trim(),
          muscle_group: muscleGroup,
          default_pr_reps: defaultPrReps,
        }),
      });

      if (!exerciseResponse.ok) {
        throw new Error('Failed to create exercise');
      }

      const newExercise = await exerciseResponse.json();

      // If PR weight and reps are provided, create the initial set
      if (prWeight !== '' && prWeight > 0 && prReps !== '' && prReps > 0) {
        const setResponse = await fetch('/api/sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: newExercise.id,
            weight: prWeight,
            reps: prReps,
            date: new Date().toISOString(),
          }),
        });

        if (!setResponse.ok) {
          console.error('Failed to create initial PR set');
        }
      }

      // Reset form
      setExerciseName('');
      setMuscleGroup('Chest');
      setDefaultPrReps('');
      setPrWeight('');
      setPrReps('');

      // Notify parent and close
      onExerciseAdded();
      onClose();
    } catch (err) {
      console.error('Error creating exercise:', err);
      setError('Failed to create exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setExerciseName('');
      setMuscleGroup('Chest');
      setDefaultPrReps('');
      setPrWeight('');
      setPrReps('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Add New Exercise
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Exercise Name */}
          <div>
            <label htmlFor="exercise-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exercise Name *
            </label>
            <input
              id="exercise-name"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Bench Press"
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
              required
            />
          </div>

          {/* Muscle Group */}
          <div>
            <label htmlFor="muscle-group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Muscle Group *
            </label>
            <select
              id="muscle-group"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
              required
            >
              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Default PR Reps */}
          <div>
            <label htmlFor="pr-reps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default PR Reps *
            </label>
            <input
              id="pr-reps"
              type="number"
              inputMode="numeric"
              min="1"
              max="50"
              value={defaultPrReps}
              onChange={(e) => setDefaultPrReps(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="e.g., 1"
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
              required
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              The rep max to display on the card (e.g., 1 for 1RM)
            </p>
          </div>

          {/* Initial PR (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial PR (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  id="pr-reps-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={prReps}
                  onChange={(e) => setPrReps(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="Reps"
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                />
              </div>
              <span className="flex items-center text-gray-400 text-lg">×</span>
              <div className="flex-1">
                <input
                  id="pr-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={prWeight}
                  onChange={(e) => setPrWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Weight"
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                />
              </div>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Add your current PR if you know it (e.g., 5 reps × 225 lbs)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !exerciseName.trim()}
              className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
