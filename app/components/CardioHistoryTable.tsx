'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';
import type { WorkoutSet } from '@/lib/types';

interface CardioHistoryTableProps {
  sets: WorkoutSet[];
}

type SortField = 'date' | 'distance' | 'duration' | 'pace';
type SortDirection = 'asc' | 'desc';

export default function CardioHistoryTable({ sets }: CardioHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
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
      case 'distance':
        comparison = (a.distance || 0) - (b.distance || 0);
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
      case 'pace':
        const paceA = (a.distance || 0) > 0 ? (a.duration || 0) / (a.distance || 1) : 0;
        const paceB = (b.distance || 0) > 0 ? (b.duration || 0) / (b.distance || 1) : 0;
        comparison = paceA - paceB;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No sessions logged yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-2 sm:px-4">
              <button
                onClick={() => handleSort('date')}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Date
                <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </th>
            <th className="text-left py-3 px-2 sm:px-4">
              <button
                onClick={() => handleSort('distance')}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Distance
                <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </th>
            <th className="text-left py-3 px-2 sm:px-4">
              <button
                onClick={() => handleSort('duration')}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Time
                <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </th>
            <th className="text-left py-3 px-2 sm:px-4">
              <button
                onClick={() => handleSort('pace')}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Pace
                <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSets.map((set) => {
            const pace = (set.distance || 0) > 0 ? ((set.duration || 0) / (set.distance || 1)).toFixed(2) : '-';

            return (
              <tr
                key={set.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                  {format(new Date(set.date), 'MMM d, yyyy')}
                </td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                  {set.distance} mi
                </td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                  {set.duration} min
                </td>
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                  {pace !== '-' ? `${pace} min/mi` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
