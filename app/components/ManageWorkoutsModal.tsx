'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { useWorkoutData } from '../context/WorkoutDataContext';
import type { WorkoutWithExercises } from '@/lib/types';
import { getPrimaryMuscleGroup } from '@/lib/muscle-utils';

interface ManageWorkoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'list' | 'edit' | 'create';
  initialWorkoutId?: string | null;
}

type ModalView = 'list' | 'edit';

export default function ManageWorkoutsModal({ 
  isOpen, 
  onClose,
  initialView = 'list',
  initialWorkoutId = null
}: ManageWorkoutsModalProps) {
  const { exercises, workouts, setWorkouts } = useWorkoutData();

  const [view, setView] = useState<ModalView>('list');
  // null = creating new workout, non-null = editing existing
  const [editingWorkout, setEditingWorkout] = useState<WorkoutWithExercises | null>(null);
  const [editName, setEditName] = useState('');
  const [editExerciseIds, setEditExerciseIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous open state to only run initialization logic when modal first opens
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setError(null);
      if (initialView === 'create') {
        handleNewWorkout();
      } else if (initialView === 'edit' && initialWorkoutId) {
        const workout = workouts.find(w => w.id === initialWorkoutId);
        if (workout) {
          handleEditWorkout(workout);
        } else {
          setView('list');
          setEditingWorkout(null);
        }
      } else {
        setView('list');
        setEditingWorkout(null);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialView, initialWorkoutId, workouts]);

  const handleClose = () => {
    setView('list');
    setEditingWorkout(null);
    setError(null);
    onClose();
  };

  const handleNewWorkout = () => {
    setEditingWorkout(null);
    setEditName('');
    setEditExerciseIds(new Set());
    setError(null);
    setView('edit');
  };

  const handleEditWorkout = (workout: WorkoutWithExercises) => {
    setEditingWorkout(workout);
    setEditName(workout.name);
    setEditExerciseIds(new Set(workout.exercise_ids));
    setError(null);
    setView('edit');
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      setWorkouts(workouts.filter((w) => w.id !== workoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
    }
  };

  const handleToggleExercise = (exerciseId: string) => {
    setEditExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleSaveWorkout = async () => {
    if (!editName.trim()) return;
    setError(null);
    setIsSaving(true);

    try {
      if (editingWorkout) {
        // --- Update existing workout ---
        if (editName.trim() !== editingWorkout.name) {
          const nameResponse = await fetch(`/api/workouts/${editingWorkout.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName.trim() }),
          });
          if (!nameResponse.ok) throw new Error('Failed to update workout name');
        }

        const exerciseResponse = await fetch(`/api/workouts/${editingWorkout.id}/exercises`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exercise_ids: Array.from(editExerciseIds) }),
        });
        if (!exerciseResponse.ok) throw new Error('Failed to update workout exercises');

        setWorkouts(
          workouts.map((w) =>
            w.id === editingWorkout.id
              ? { ...w, name: editName.trim(), exercise_ids: Array.from(editExerciseIds) }
              : w
          )
        );
      } else {
        // --- Create new workout + set exercises in one flow ---
        const createResponse = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName.trim() }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create workout');
        }

        const created: WorkoutWithExercises = await createResponse.json();

        // Set exercises if any selected
        if (editExerciseIds.size > 0) {
          const exerciseResponse = await fetch(`/api/workouts/${created.id}/exercises`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercise_ids: Array.from(editExerciseIds) }),
          });
          if (!exerciseResponse.ok) throw new Error('Failed to set workout exercises');
        }

        setWorkouts([...workouts, { ...created, exercise_ids: Array.from(editExerciseIds) }]);
      }

      setView('list');
      setEditingWorkout(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setEditingWorkout(null);
    setError(null);
  };

  if (!isOpen) return null;

  const isNew = view === 'edit' && !editingWorkout;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            {view === 'edit' && (
              <button
                onClick={handleBackToList}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {view === 'list' ? 'Manage Workouts' : isNew ? 'New Workout' : 'Edit Workout'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {view === 'list' ? (
            <div className="space-y-3">
              {/* Create new workout button */}
              <button
                onClick={handleNewWorkout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Workout
              </button>

              {/* Workout list */}
              {workouts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                  No workouts yet. Create one to get started.
                </p>
              )}

              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <button
                    onClick={() => handleEditWorkout(workout)}
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {workout.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {workout.exercise_ids.length} exercise{workout.exercise_ids.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Pencil className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Edit / New workout view — name + exercises on one screen */
            <div className="space-y-4">
              {/* Workout name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Push Day, Upper Body"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus={isNew}
                />
              </div>

              {/* Exercise checklist grouped by muscle group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exercises ({editExerciseIds.size} selected)
                </label>
                <div className="max-h-[40vh] overflow-y-auto">
                  {(() => {
                    // Group exercises by primary muscle group
                    const grouped = new Map<string, typeof exercises>();
                    exercises.forEach((exercise) => {
                      const group = getPrimaryMuscleGroup(exercise);
                      const existing = grouped.get(group) || [];
                      existing.push(exercise);
                      grouped.set(group, existing);
                    });

                    return Array.from(grouped.entries()).map(([group, groupExercises]) => (
                      <div key={group} className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-1">
                          {group}
                        </p>
                        {groupExercises.map((exercise) => (
                          <label
                            key={exercise.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editExerciseIds.has(exercise.id)}
                              onChange={() => handleToggleExercise(exercise.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {exercise.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (save button for edit view) */}
        {view === 'edit' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-between items-center gap-4">
            {editingWorkout && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this workout?')) {
                    handleDeleteWorkout(editingWorkout.id);
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSaveWorkout}
              disabled={isSaving || !editName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
