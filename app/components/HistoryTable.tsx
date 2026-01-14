'use client';

import { useState } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { format } from 'date-fns';

interface HistoryTableProps {
  sets: WorkoutSet[];
}

type SortField = 'date' | 'weight' | 'reps';
type SortDirection = 'asc' | 'desc';

export default function HistoryTable({ sets }: HistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSets = [...sets].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'weight':
        comparison = (a.weight || 0) - (b.weight || 0);
        break;
      case 'reps':
        comparison = (a.reps || 0) - (b.reps || 0);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No sets logged yet. Start tracking your progress!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full border-collapse min-w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th
              onClick={() => handleSort('date')}
              className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            >
              Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              onClick={() => handleSort('weight')}
              className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            >
              Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              onClick={() => handleSort('reps')}
              className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            >
              Reps {sortField === 'reps' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSets.map((set) => (
            <tr
              key={set.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
            >
              <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {format(new Date(set.date), 'MMM d, yyyy h:mm a')}
              </td>
              <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-white font-semibold whitespace-nowrap">
                {set.weight} lbs
              </td>
              <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-white font-semibold">
                {set.reps}
              </td>
              <td className="p-2 sm:p-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                {set.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
