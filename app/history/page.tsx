'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Check, X, Trash2 } from 'lucide-react';
import NavBar from '../components/NavBar';
import type { WorkoutSet } from '@/lib/types';
import { useWorkoutData } from '../context/WorkoutDataContext';

interface SetWithExercise extends WorkoutSet {
  exercise_name?: string;
  muscle_group?: string;
  exercise_type?: string;
  uses_body_weight?: boolean;
}

// Format weight display for body weight vs regular exercises
const formatWeight = (weight: number, usesBodyWeight: boolean): string => {
  if (!usesBodyWeight) {
    return `${weight} lbs`;
  }
  return weight > 0 ? `BW + ${weight} lbs` : 'BW';
};

interface ExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  exerciseType: string;
  topSet: SetWithExercise;
  otherSets: SetWithExercise[];
}

interface DayGroup {
  dateKey: string;
  displayDate: string;
  exercises: ExerciseGroup[];
}

// Get user's timezone or default to PST
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
};

// Get date key (YYYY-MM-DD) in user's timezone
const getDateKey = (date: Date, timezone: string) => {
  const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: timezone });
  const month = date.toLocaleString('en-US', { month: '2-digit', timeZone: timezone });
  const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: timezone });
  return `${year}-${month}-${day}`;
};

// Format date for display
const formatDisplayDate = (date: Date, timezone: string) => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });
};

// Format time for display
const formatTime = (date: Date, timezone: string) => {
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
};

export default function HistoryPage() {
  const { exercises, sets: contextSets, loading, fetchAllData } = useWorkoutData();
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editReps, setEditReps] = useState<number>(0);
  const [editDistance, setEditDistance] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timezone = getUserTimezone();

  // Flatten sets from context and merge with exercise info
  const sets = useMemo(() => {
    if (!exercises || !contextSets) return [];
    const allSets: SetWithExercise[] = [];
    
    exercises.forEach(exercise => {
      const exerciseSets = contextSets[exercise.id];
      if (exerciseSets) {
        exerciseSets.forEach(set => {
          allSets.push({
            ...set,
            exercise_name: exercise.name,
            muscle_group: exercise.muscle_group,
            exercise_type: exercise.exercise_type,
            uses_body_weight: exercise.uses_body_weight
          });
        });
      }
    });
    return allSets;
  }, [exercises, contextSets]);

  // Group sets by day, then by exercise
  const groupedByDay = useMemo(() => {
    const dayMap = new Map<string, Map<string, SetWithExercise[]>>();

    sets.forEach((set) => {
      const date = new Date(set.date);
      const dateKey = getDateKey(date, timezone);

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, new Map());
      }

      const exerciseMap = dayMap.get(dateKey)!;
      const exerciseId = set.exercise_id;

      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, []);
      }

      exerciseMap.get(exerciseId)!.push(set);
    });

    // Convert to array of DayGroup
    const dayGroups: DayGroup[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // Sort days newest first
      .map(([dateKey, exerciseMap]) => {
        const exercises: ExerciseGroup[] = Array.from(exerciseMap.entries())
          .map(([exerciseId, exerciseSets]) => {
            // Sort sets: for strength by weight desc, for cardio by distance desc
            const sortedSets = [...exerciseSets].sort((a, b) => {
              if (a.exercise_type === 'cardio') {
                return (b.distance || 0) - (a.distance || 0);
              }
              return (b.weight || 0) - (a.weight || 0);
            });

            const topSet = sortedSets[0];
            const otherSets = sortedSets.slice(1);

            return {
              exerciseId,
              exerciseName: topSet.exercise_name || 'Unknown Exercise',
              exerciseType: topSet.exercise_type || 'strength',
              topSet,
              otherSets,
            };
          })
          // Sort exercises by their first set time (earliest first)
          .sort((a, b) => {
            const aTime = new Date(a.topSet.date).getTime();
            const bTime = new Date(b.topSet.date).getTime();
            return aTime - bTime;
          });

        // Get display date from first exercise's top set
        const firstSet = exercises[0]?.topSet;
        const displayDate = firstSet
          ? formatDisplayDate(new Date(firstSet.date), timezone)
          : dateKey;

        return {
          dateKey,
          displayDate,
          exercises,
        };
      });

    return dayGroups;
  }, [sets, timezone]);

  const toggleExercise = (dateKey: string, exerciseId: string) => {
    const key = `${dateKey}-${exerciseId}`;
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isExpanded = (dateKey: string, exerciseId: string) => {
    return expandedExercises.has(`${dateKey}-${exerciseId}`);
  };

  const startEditing = (set: SetWithExercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(set.id);
    setEditNotes(set.notes ?? '');
    if (set.exercise_type === 'cardio') {
      setEditDistance(set.distance ?? 0);
      setEditDuration(set.duration ?? 0);
    } else {
      setEditWeight(set.weight ?? 0);
      setEditReps(set.reps ?? 0);
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(null);
  };

  const saveEdit = async (set: SetWithExercise, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingSetId) return;

    setIsSubmitting(true);
    try {
      const body = set.exercise_type === 'cardio'
        ? { distance: editDistance, duration: editDuration, notes: editNotes || null }
        : { weight: editWeight, reps: editReps, notes: editNotes || null };

      const response = await fetch(`/api/sets/${editingSetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchAllData();
      }
    } catch (error) {
      console.error('Error updating set:', error);
    } finally {
      setEditingSetId(null);
      setIsSubmitting(false);
    }
  };

  const deleteSet = async (setId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this set?')) return;

    try {
      const response = await fetch(`/api/sets/${setId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  // Render set row with edit/delete buttons
  const renderSetActions = (set: SetWithExercise) => {
    const isEditing = editingSetId === set.id;

    if (isEditing) {
      if (set.exercise_type === 'cardio') {
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              step="0.01"
              value={editDistance}
              onChange={(e) => setEditDistance(parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="mi"
              autoFocus
            />
            <span className="text-gray-400 text-xs">mi</span>
            <input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
              className="w-14 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="min"
            />
            <span className="text-gray-400 text-xs">min</span>
            <button
              onClick={(e) => saveEdit(set, e)}
              disabled={isSubmitting}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            step="0.01"
            value={editWeight}
            onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="lbs"
            autoFocus
          />
          <span className="text-gray-400">×</span>
          <input
            type="number"
            value={editReps}
            onChange={(e) => setEditReps(parseInt(e.target.value) || 0)}
            className="w-12 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="reps"
          />
          <button
            onClick={(e) => saveEdit(set, e)}
            disabled={isSubmitting}
            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEditing}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    const display = formatSetDisplay(set, true);
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white">
          {display.inline}
        </span>
        <button
          onClick={(e) => startEditing(set, e)}
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          title="Edit set"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => deleteSet(set.id, e)}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Delete set"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Render notes section - shows input when editing, otherwise shows notes
  const renderNotesSection = (set: SetWithExercise) => {
    const isEditing = editingSetId === set.id;

    if (isEditing) {
      return (
        <input
          type="text"
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
          placeholder="Notes (optional)"
        />
      );
    }

    if (set.notes) {
      return (
        <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border-l-2 border-blue-400">
          {set.notes}
        </div>
      );
    }

    return null;
  };

  // Format set display based on exercise type
  const formatSetDisplay = (set: SetWithExercise, inline: boolean = false) => {
    if (set.exercise_type === 'cardio') {
      const distance = set.distance?.toFixed(2) || '0';
      const duration = set.duration || 0;
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      if (inline) {
        return { inline: `${distance} mi • ${timeStr}` };
      }
      return { primary: `${distance} mi`, secondary: timeStr };
    }
    const weightStr = formatWeight(set.weight ?? 0, set.uses_body_weight ?? false);
    if (inline) {
      return { inline: `${weightStr} × ${set.reps}` };
    }
    return { primary: weightStr, secondary: `${set.reps}` };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exercises
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
          Workout History
        </h1>
        {groupedByDay.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No workout history yet. Start logging your sets!
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByDay.map((dayGroup) => (
              <div
                key={dayGroup.dateKey}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Day Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {dayGroup.displayDate}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dayGroup.exercises.length} exercise{dayGroup.exercises.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Exercises */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {dayGroup.exercises.map((exercise) => {
                    const expanded = isExpanded(dayGroup.dateKey, exercise.exerciseId);
                    const hasMoreSets = exercise.otherSets.length > 0;

                    return (
                      <div key={exercise.exerciseId}>
                        {/* Exercise Row */}
                        <div
                          onClick={() => hasMoreSets && toggleExercise(dayGroup.dateKey, exercise.exerciseId)}
                          className={`flex items-center px-4 py-3 ${
                            hasMoreSets ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
                          }`}
                        >
                          {/* Chevron */}
                          <div className="w-6 flex-shrink-0">
                            {hasMoreSets && (
                              <button className="text-gray-400">
                                {expanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Exercise Name */}
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {exercise.exerciseName}
                            </div>
                            {hasMoreSets && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {exercise.otherSets.length + 1} sets
                              </div>
                            )}
                            <div className="mt-1">
                              {renderNotesSection(exercise.topSet)}
                            </div>
                          </div>

                          {/* Top Set Display with Edit/Delete */}
                          <div className="flex-shrink-0">
                            {renderSetActions(exercise.topSet)}
                          </div>
                        </div>

                        {/* Expanded Sets */}
                        {expanded && exercise.otherSets.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                            {exercise.otherSets.map((set) => (
                              <div
                                key={set.id}
                                className="flex items-center px-4 py-2 pl-10 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                              >
                                <div className="flex-1 min-w-0 mr-2">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatTime(new Date(set.date), timezone)}
                                  </div>
                                  <div className="mt-1">
                                    {renderNotesSection(set)}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {renderSetActions(set)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
