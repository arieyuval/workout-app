'use client';

import { useState, useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface HistoryTableProps {
  sets: WorkoutSet[];
}

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

export default function HistoryTable({ sets }: HistoryTableProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
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
                {dayGroup.topSet.notes && (
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {dayGroup.topSet.notes}
                  </div>
                )}
              </div>

              {/* Right: Weight/Reps */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {dayGroup.topSet.weight} lbs
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dayGroup.topSet.reps} reps
                </div>
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
                      {set.notes && (
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {set.notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Weight/Reps */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        {set.weight} lbs
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {set.reps} reps
                      </div>
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
