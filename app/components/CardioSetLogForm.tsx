'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TimeInput from './TimeInput';

interface CardioSetLogFormProps {
  exerciseId: string;
  lastSet: { distance: number; duration: number } | null;
  onSetLogged: () => void;
}

// Get user's timezone or default to PST
const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
};

// Create a date string that preserves the user's local time
const getLocalDateISO = () => {
  const now = new Date();
  const timezone = getUserTimezone();

  // Get the date parts in user's timezone
  const year = now.toLocaleString('en-US', { year: 'numeric', timeZone: timezone });
  const month = now.toLocaleString('en-US', { month: '2-digit', timeZone: timezone });
  const day = now.toLocaleString('en-US', { day: '2-digit', timeZone: timezone });
  const hour = now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: timezone }).padStart(2, '0');
  const minute = now.toLocaleString('en-US', { minute: '2-digit', timeZone: timezone }).padStart(2, '0');
  const second = now.toLocaleString('en-US', { second: '2-digit', timeZone: timezone }).padStart(2, '0');

  // Return ISO format with the local time (stored as if it were UTC, but representing local time)
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
};

export default function CardioSetLogForm({ exerciseId, lastSet, onSetLogged }: CardioSetLogFormProps) {
  const [distance, setDistance] = useState(lastSet?.distance || 0);
  const [duration, setDuration] = useState(lastSet?.duration || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
        date: getLocalDateISO(),
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

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset form fields
      setDistance(0);
      setDuration(0);

      // Notify parent
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
              Duration
            </label>
            <TimeInput
              id="duration"
              value={duration}
              onChange={setDuration}
              placeholder="e.g., 2345"
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base touch-manipulation"
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
          className={`w-full px-4 py-2 sm:py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium touch-manipulation ${
            showSuccess
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          } text-white`}
        >
          {isSubmitting ? (
            <>Logging...</>
          ) : showSuccess ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Logged!
            </>
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
