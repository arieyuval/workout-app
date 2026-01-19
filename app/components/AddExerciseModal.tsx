'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import type { MuscleGroup, ExerciseType, Exercise } from '@/lib/types';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: () => void;
}

const strengthMuscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

// Get text color for muscle group in suggestions
const getMuscleGroupColor = (muscleGroup: string): string => {
  const colors: Record<string, string> = {
    Chest: 'text-rose-600 dark:text-rose-400',
    Back: 'text-blue-600 dark:text-blue-400',
    Legs: 'text-green-600 dark:text-green-400',
    Shoulders: 'text-amber-600 dark:text-amber-400',
    Arms: 'text-purple-600 dark:text-purple-400',
    Core: 'text-yellow-600 dark:text-yellow-400',
    Cardio: 'text-teal-600 dark:text-teal-400',
  };
  return colors[muscleGroup] || 'text-gray-500';
};

export default function AddExerciseModal({ isOpen, onClose, onExerciseAdded }: AddExerciseModalProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('strength');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Chest');
  const [defaultPrReps, setDefaultPrReps] = useState<number | ''>('');
  // Strength PR fields
  const [prWeight, setPrWeight] = useState<number | ''>('');
  const [prReps, setPrReps] = useState<number | ''>('');
  // Cardio PR fields
  const [prDistance, setPrDistance] = useState<number | ''>('');
  const [prDuration, setPrDuration] = useState<number | ''>('');
  // Body weight exercise toggle
  const [usesBodyWeight, setUsesBodyWeight] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete state
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all exercises for autocomplete when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllExercises();
    }
  }, [isOpen]);

  const fetchAllExercises = async () => {
    try {
      const response = await fetch('/api/exercises/all');
      if (response.ok) {
        const data = await response.json();
        setAllExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises for autocomplete:', error);
    }
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (exerciseName.trim().length >= 1) {
      const filtered = allExercises
        .filter((ex) =>
          ex.name.toLowerCase().includes(exerciseName.toLowerCase().trim())
        )
        .slice(0, 6); // Limit to 6 suggestions
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [exerciseName, allExercises]);

  // Handle clicking outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (exercise: Exercise) => {
    setExerciseName(exercise.name);
    setExerciseType(exercise.exercise_type);
    if (exercise.exercise_type === 'strength') {
      setMuscleGroup(exercise.muscle_group as MuscleGroup);
      setDefaultPrReps(exercise.default_pr_reps);
    }
    setShowSuggestions(false);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!exerciseName.trim()) {
      setError('Exercise name is required');
      return;
    }

    // Validate based on exercise type
    if (exerciseType === 'strength') {
      if (defaultPrReps === '' || defaultPrReps < 1 || defaultPrReps > 50) {
        setError('Default PR reps must be between 1 and 50');
        return;
      }

      // Validate PR inputs - both reps and weight must be provided together
      if ((prWeight !== '' && prReps === '') || (prWeight === '' && prReps !== '')) {
        setError('Please provide both reps and weight for the initial PR, or leave both empty');
        return;
      }
    } else if (exerciseType === 'cardio') {
      // Validate cardio PR inputs - both distance and duration must be provided together
      if ((prDistance !== '' && prDuration === '') || (prDistance === '' && prDuration !== '')) {
        setError('Please provide both distance and duration for the initial session, or leave both empty');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create the exercise
      const exerciseResponse = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exerciseName.trim(),
          muscle_group: exerciseType === 'cardio' ? 'Cardio' : muscleGroup,
          exercise_type: exerciseType,
          default_pr_reps: exerciseType === 'strength' ? defaultPrReps : 1, // Default to 1 for cardio
        }),
      });

      if (!exerciseResponse.ok) {
        const errorData = await exerciseResponse.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to create exercise: ' + JSON.stringify(errorData));
      }

      const newExercise = await exerciseResponse.json();

      // Create initial set based on exercise type
      if (exerciseType === 'strength' && prWeight !== '' && prWeight > 0 && prReps !== '' && prReps > 0) {
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
      } else if (exerciseType === 'cardio' && prDistance !== '' && prDistance > 0 && prDuration !== '' && prDuration > 0) {
        const setResponse = await fetch('/api/sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: newExercise.id,
            distance: prDistance,
            duration: prDuration,
            date: new Date().toISOString(),
          }),
        });

        if (!setResponse.ok) {
          console.error('Failed to create initial cardio session');
        }
      }

      // Reset form
      setExerciseName('');
      setExerciseType('strength');
      setMuscleGroup('Chest');
      setDefaultPrReps('');
      setPrWeight('');
      setPrReps('');
      setPrDistance('');
      setPrDuration('');

      // Notify parent and close
      onExerciseAdded();
      onClose();

      // Note: The API handles checking for existing exercises automatically.
      // If an exercise with the same name and muscle group exists, it will
      // be added to the user's feed instead of creating a duplicate.
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
      setExerciseType('strength');
      setMuscleGroup('Chest');
      setDefaultPrReps('');
      setPrWeight('');
      setPrReps('');
      setPrDistance('');
      setPrDuration('');
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
          {/* Exercise Name with Autocomplete */}
          <div className="relative">
            <label htmlFor="exercise-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exercise Name *
            </label>
            <input
              ref={inputRef}
              id="exercise-name"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="e.g., Bench Press"
              disabled={isSubmitting}
              autoComplete="off"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
              required
            />

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(exercise)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {exercise.name}
                    </span>
                    <span className={`text-xs ${getMuscleGroupColor(exercise.muscle_group)}`}>
                      {exercise.muscle_group}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exercise Type */}
          <div>
            <label htmlFor="exercise-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exercise Type *
            </label>
            <select
              id="exercise-type"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
              required
            >
              <option value="strength">Strength Training</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          {/* Muscle Group (only for strength) */}
          {exerciseType === 'strength' && (
            <>
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
                  {strengthMuscleGroups.map((group: MuscleGroup) => (
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
            </>
          )}

          {/* Cardio Initial Session (Optional) */}
          {exerciseType === 'cardio' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Session (Optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    id="pr-distance"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={prDistance}
                    onChange={(e) => setPrDistance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Distance"
                    disabled={isSubmitting}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                  />
                </div>
                <span className="flex items-center text-gray-400 text-lg">/</span>
                <div className="flex-1">
                  <input
                    id="pr-duration"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={prDuration}
                    onChange={(e) => setPrDuration(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Minutes"
                    disabled={isSubmitting}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Add your initial session if you would like (e.g., 3.5 miles / 30 minutes)
              </p>
            </div>
          )}

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
