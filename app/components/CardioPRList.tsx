'use client';

import { format } from 'date-fns';
import { Trophy } from 'lucide-react';
import type { WorkoutSet } from '@/lib/types';

interface CardioPRListProps {
  sets: WorkoutSet[];
}

interface CardioPR {
  distance: number;
  bestTime: number;
  bestPace: number;
  date: string;
}

export default function CardioPRList({ sets }: CardioPRListProps) {
  // Calculate PRs for common distances
  const calculatePRs = (): CardioPR[] => {
    const distances = [1, 3.1, 5, 6.2, 10, 13.1]; // 1 mile, 5K, 5 miles, 10K, 10 miles, half marathon
    const prs: CardioPR[] = [];

    distances.forEach((targetDistance) => {
      // Find sessions at or near this distance (within 0.1 miles)
      const relevantSets = sets.filter(
        (set) => set.distance && Math.abs(set.distance - targetDistance) <= 0.1
      );

      if (relevantSets.length > 0) {
        // Find best time (lowest duration)
        const bestSet = relevantSets.reduce((best, current) => {
          return (current.duration || Infinity) < (best.duration || Infinity) ? current : best;
        });

        if (bestSet.distance && bestSet.duration) {
          prs.push({
            distance: bestSet.distance,
            bestTime: bestSet.duration,
            bestPace: bestSet.duration / bestSet.distance,
            date: bestSet.date,
          });
        }
      }
    });

    return prs;
  };

  const prs = calculatePRs();

  // Also calculate overall best pace
  const bestPaceSet = sets.reduce<WorkoutSet | null>((best, current) => {
    if (!current.distance || !current.duration) return best;
    const currentPace = current.duration / current.distance;
    if (!best || !best.distance || !best.duration) return current;
    const bestPace = best.duration / best.distance;
    return currentPace < bestPace ? current : best;
  }, null);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDistanceLabel = (distance: number): string => {
    if (distance === 3.1) return '5K';
    if (distance === 6.2) return '10K';
    if (distance === 13.1) return 'Half Marathon';
    if (distance === 26.2) return 'Marathon';
    return `${distance} mi`;
  };

  if (prs.length === 0 && !bestPaceSet) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No personal records yet. Keep logging sessions!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Best Overall Pace */}
      {bestPaceSet && bestPaceSet.distance && bestPaceSet.duration && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="text-sm font-bold text-green-900 dark:text-green-100">
              Best Pace Overall
            </h4>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {(bestPaceSet.duration / bestPaceSet.distance).toFixed(2)} min/mile
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 mt-1">
            {bestPaceSet.distance} mi in {formatDuration(bestPaceSet.duration)} • {format(new Date(bestPaceSet.date), 'MMM d, yyyy')}
          </div>
        </div>
      )}

      {/* Distance PRs */}
      {prs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Best Times by Distance
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prs.map((pr, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {getDistanceLabel(pr.distance)}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatDuration(pr.bestTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {pr.bestPace.toFixed(2)} min/mi pace
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {format(new Date(pr.date), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
