'use client';

import type { PersonalRecord } from '@/lib/types';
import { format, isAfter, subDays } from 'date-fns';
import { Award } from 'lucide-react';

interface PRListProps {
  records: PersonalRecord[];
}

export default function PRList({ records }: PRListProps) {
  const isRecent = (date: string) => {
    const prDate = new Date(date);
    const sevenDaysAgo = subDays(new Date(), 7);
    return isAfter(prDate, sevenDaysAgo);
  };

  if (records.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No personal records yet. Start lifting to set your PRs!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {records.map((record) => (
        <div
          key={record.reps}
          className={`p-3 sm:p-4 rounded-lg border-2 ${
            isRecent(record.date)
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Award
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isRecent(record.date)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400'
                }`}
              />
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {record.reps}RM
              </span>
            </div>
            {isRecent(record.date) && (
              <span className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/40 rounded">
                NEW
              </span>
            )}
          </div>

          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {record.weight} lbs
          </div>

          <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            {format(new Date(record.date), 'MMM d, yyyy')}
          </div>
        </div>
      ))}
    </div>
  );
}
