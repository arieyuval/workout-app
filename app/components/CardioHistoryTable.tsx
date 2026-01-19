'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Pencil, Check, X, Trash2 } from 'lucide-react';
import type { WorkoutSet } from '@/lib/types';

interface CardioHistoryTableProps {
  sets: WorkoutSet[];
  onSetUpdated?: () => void;
  onSetDeleted?: () => void;
}

interface DayGroup {
  date: string;
  displayDate: string;
  topSet: WorkoutSet;
  topPace: number;
  otherSets: { set: WorkoutSet; pace: number }[];
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

export default function CardioHistoryTable({ sets, onSetUpdated, onSetDeleted }: CardioHistoryTableProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editDistance, setEditDistance] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timezone = getUserTimezone();

  // Group sets by day and find the top set (best pace) for each day
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
        // Calculate pace for each set and sort by pace (ascending - best first)
        const setsWithPace = daySets.map((set) => ({
          set,
          pace: (set.distance || 0) > 0 ? (set.duration || 0) / (set.distance || 1) : Infinity,
        }));
        setsWithPace.sort((a, b) => a.pace - b.pace);

        const topSetData = setsWithPace[0];
        const otherSetsData = setsWithPace.slice(1);

        // Format display date from the first set
        const displayDate = formatDateInTimezone(new Date(topSetData.set.date), timezone, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          date: dateKey,
          displayDate,
          topSet: topSetData.set,
          topPace: topSetData.pace,
          otherSets: otherSetsData,
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
    setEditDistance(set.distance ?? 0);
    setEditDuration(set.duration ?? 0);
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
          distance: editDistance,
          duration: editDuration,
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
    if (!confirm('Are you sure you want to delete this session?')) return;

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

  const renderSetRow = (set: WorkoutSet, pace: number, isTopSet: boolean = false) => {
    const isEditing = editingSetId === set.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 sm:gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              value={editDistance}
              onChange={(e) => setEditDistance(parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="mi"
              autoFocus
            />
            <span className="text-xs text-gray-400">mi</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
              className="w-14 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="min"
            />
            <span className="text-xs text-gray-400">min</span>
          </div>
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
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-right">
          <div className={`text-sm sm:text-base ${isTopSet ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {set.distance} mi
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {set.duration} min
          </div>
        </div>
        <div className="text-right min-w-[70px]">
          <div className={`text-sm sm:text-base ${isTopSet ? 'font-bold' : 'font-medium'} text-green-600 dark:text-green-400`}>
            {pace !== Infinity ? `${pace.toFixed(2)}` : '-'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">min/mi</div>
        </div>
        <button
          onClick={(e) => startEditing(set, e)}
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          title="Edit session"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => deleteSet(set.id, e)}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Delete session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No sessions logged yet
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
                      {dayGroup.otherSets.length + 1} sessions
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Notes */}
              <div className="flex-1 min-w-0 px-2 sm:px-4">
                {dayGroup.topSet.notes && (
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {dayGroup.topSet.notes}
                  </div>
                )}
              </div>

              {/* Right: Distance/Duration + Pace with Edit */}
              <div className="flex-shrink-0">
                {renderSetRow(dayGroup.topSet, dayGroup.topPace, true)}
              </div>
            </div>

            {/* Expanded section - other sets from the same day */}
            {isExpanded && dayGroup.otherSets.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {dayGroup.otherSets.map(({ set, pace }) => (
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
                      {set.notes && (
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {set.notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Distance/Duration + Pace with Edit */}
                    <div className="flex-shrink-0">
                      {renderSetRow(set, pace, false)}
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
