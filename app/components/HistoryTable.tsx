'use client';

import { useState, useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { ChevronDown, ChevronRight, Pencil, Check, X, Trash2 } from 'lucide-react';

interface HistoryTableProps {
  sets: WorkoutSet[];
  usesBodyWeight?: boolean;
  onSetUpdated?: () => void;
  onSetDeleted?: () => void;
}

// Format weight display for body weight vs regular exercises
const formatWeight = (weight: number, usesBodyWeight: boolean): string => {
  if (!usesBodyWeight) {
    return `${weight} lbs`;
  }
  return weight > 0 ? `BW + ${weight} lbs` : 'BW';
};

interface DayGroup {
  date: string;
  displayDate: string;
  topSet: WorkoutSet;
  otherSets: WorkoutSet[];
}

// Get user's timezone or default to PST
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
};

// Format date in user's timezone
const formatDateInTimezone = (date: Date, timezone: string, options: Intl.DateTimeFormatOptions) => {
  return date.toLocaleString('en-US', { ...options, timeZone: timezone });
};

// Get date key (YYYY-MM-DD) in user's timezone
const getDateKey = (date: Date, timezone: string) => {
  const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: timezone });
  const month = date.toLocaleString('en-US', { month: '2-digit', timeZone: timezone });
  const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: timezone });
  return `${year}-${month}-${day}`;
};

export default function HistoryTable({ sets, usesBodyWeight = false, onSetUpdated, onSetDeleted }: HistoryTableProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editReps, setEditReps] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timezone = getUserTimezone();

  // Group sets by day and find the top set (heaviest) for each day
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, WorkoutSet[]>();

    sets.forEach((set) => {
      // Convert to user's timezone for grouping
      const utcDate = new Date(set.date);
      const dayKey = getDateKey(utcDate, timezone);
      const existing = groups.get(dayKey) || [];
      existing.push(set);
      groups.set(dayKey, existing);
    });

    // Convert to array of DayGroup, sorted by date (newest first)
    const dayGroups: DayGroup[] = Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, daySets]) => {
        // Sort sets by weight descending to find the top set
        const sortedSets = [...daySets].sort((a, b) => (b.weight || 0) - (a.weight || 0));
        const topSet = sortedSets[0];
        const otherSets = sortedSets.slice(1);

        // Format display date from the first set
        const displayDate = formatDateInTimezone(new Date(topSet.date), timezone, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          date: dateKey,
          displayDate,
          topSet,
          otherSets,
        };
      });

    return dayGroups;
  }, [sets, timezone]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  // Helper to format time from a set in user's timezone
  const formatTime = (set: WorkoutSet) => {
    return formatDateInTimezone(new Date(set.date), timezone, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const startEditing = (set: WorkoutSet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(set.id);
    setEditWeight(set.weight ?? 0);
    setEditReps(set.reps ?? 0);
    setEditNotes(set.notes ?? '');
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(null);
  };

  const saveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingSetId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sets/${editingSetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: editWeight,
          reps: editReps,
          notes: editNotes || null,
        }),
      });

      if (response.ok) {
        onSetUpdated?.();
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
        onSetDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const renderSetRow = (set: WorkoutSet, isTopSet: boolean = false) => {
    const isEditing = editingSetId === set.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            step="0.01"
            value={editWeight}
            onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
            className="w-16 sm:w-20 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="Weight"
            autoFocus
          />
          <span className="text-gray-400">×</span>
          <input
            type="number"
            value={editReps}
            onChange={(e) => setEditReps(parseInt(e.target.value) || 0)}
            className="w-12 sm:w-16 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="Reps"
          />
          <button
            onClick={saveEdit}
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
      <div className="flex items-center gap-2">
        <div className={`text-sm sm:text-base ${isTopSet ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
          {formatWeight(set.weight ?? 0, usesBodyWeight)} × {set.reps}
        </div>
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

  const renderNotesSection = (set: WorkoutSet) => {
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

  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No sets logged yet. Start tracking your progress!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groupedByDay.map((dayGroup) => {
        const isExpanded = expandedDays.has(dayGroup.date);
        const hasMoreSets = dayGroup.otherSets.length > 0;

        return (
          <div
            key={dayGroup.date}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Main row - always visible */}
            <div
              onClick={() => hasMoreSets && toggleDay(dayGroup.date)}
              className={`flex items-center p-3 sm:p-4 ${
                hasMoreSets ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              } bg-white dark:bg-gray-800`}
            >
              {/* Left: Chevron + Date */}
              <div className="flex items-center gap-3 sm:gap-4 w-32 sm:w-40 flex-shrink-0">
                {hasMoreSets ? (
                  <button className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                ) : (
                  <div className="w-5 flex-shrink-0" />
                )}
                <div>
                  <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                    {dayGroup.displayDate}
                  </div>
                  {hasMoreSets && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayGroup.otherSets.length + 1} sets
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Notes */}
              <div className="flex-1 min-w-0 px-2 sm:px-4">
                {renderNotesSection(dayGroup.topSet)}
              </div>

              {/* Right: Weight/Reps with Edit */}
              <div className="flex-shrink-0">
                {renderSetRow(dayGroup.topSet, true)}
              </div>
            </div>

            {/* Expanded section - other sets from the same day */}
            {isExpanded && dayGroup.otherSets.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {dayGroup.otherSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center p-3 sm:p-4 pl-12 sm:pl-14 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    {/* Left: Time */}
                    <div className="w-20 sm:w-28 flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(set)}
                      </div>
                    </div>

                    {/* Center: Notes */}
                    <div className="flex-1 min-w-0 px-2 sm:px-4">
                      {renderNotesSection(set)}
                    </div>

                    {/* Right: Weight/Reps with Edit */}
                    <div className="flex-shrink-0">
                      {renderSetRow(set, false)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
