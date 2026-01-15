'use client';

import { useState } from 'react';
import type { SetFormData } from '@/lib/types';

interface SetLogFormProps {
  exerciseId: string;
  onSuccess: () => void;
}

export default function SetLogForm({ exerciseId, onSuccess }: SetLogFormProps) {
  const [formData, setFormData] = useState<SetFormData>({
    weight: 0,
    reps: 0,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.weight <= 0 || formData.reps <= 0) {
      setError('Weight and reps must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_id: exerciseId,
          weight: formData.weight,
          reps: formData.reps,
          notes: formData.notes || undefined,
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log set');
      }

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset form
      setFormData({ weight: 0, reps: 0, notes: '' });
      onSuccess();
    } catch (err) {
      setError('Failed to log set. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
        Log New Set
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="weight" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Weight (lbs)
          </label>
          <input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={formData.weight || ''}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            required
          />
        </div>

        <div>
          <label htmlFor="reps" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Reps
          </label>
          <input
            id="reps"
            type="number"
            min="1"
            inputMode="numeric"
            value={formData.reps || ''}
            onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 0 })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="How did it feel? Any form notes?"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full font-semibold py-3 sm:py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-base flex items-center justify-center gap-2 ${
          showSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        } text-white`}
      >
        {isSubmitting ? (
          'Logging...'
        ) : showSuccess ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Logged!
          </>
        ) : (
          'Log Set'
        )}
      </button>
    </form>
  );
}
