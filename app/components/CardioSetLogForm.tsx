'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface CardioSetLogFormProps {
  exerciseId: string;
  lastSet: { distance: number; duration: number } | null;
  onSetLogged: () => void;
}

export default function CardioSetLogForm({ exerciseId, lastSet, onSetLogged }: CardioSetLogFormProps) {
  const [distance, setDistance] = useState(lastSet?.distance || 0);
  const [duration, setDuration] = useState(lastSet?.duration || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (distance <= 0 || duration <= 0) {
      setError('Please enter valid distance and duration');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        exercise_id: exerciseId,
        distance,
        duration,
        date: new Date().toISOString(),
      };
      console.log('Sending cardio set payload:', payload);

      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to log session');
      }

      const result = await response.json();
      console.log('Successfully logged session:', result);

      // Reset form and notify parent
      onSetLogged();
    } catch (err) {
      console.error('Error logging session:', err);
      setError(err instanceof Error ? err.message : 'Failed to log session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate pace (minutes per mile)
  const pace = distance > 0 && duration > 0 ? (duration / distance).toFixed(2) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
        Log Session
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Distance Input */}
          <div>
            <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distance (miles)
            </label>
            <input
              id="distance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={distance || ''}
              onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base touch-manipulation"
              disabled={isSubmitting}
            />
          </div>

          {/* Duration Input */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (min)
            </label>
            <input
              id="duration"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={duration || ''}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base touch-manipulation"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Pace Display */}
        {pace && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">
              Pace
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              {pace} min/mile
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || distance <= 0 || duration <= 0}
          className="w-full px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium touch-manipulation"
        >
          {isSubmitting ? (
            <>Logging...</>
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Log Session
            </>
          )}
        </button>
      </form>
    </div>
  );
}
