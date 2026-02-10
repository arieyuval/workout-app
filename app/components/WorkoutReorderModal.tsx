'use client';

import { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import type { WorkoutWithExercises } from '@/lib/types';

interface WorkoutReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: WorkoutWithExercises[];
  onSave: (orderedIds: string[]) => void;
}

export default function WorkoutReorderModal({
  isOpen,
  onClose,
  workouts,
  onSave,
}: WorkoutReorderModalProps) {
  const [ordered, setOrdered] = useState(() => workouts.map((w) => ({ id: w.id, name: w.name })));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOrdered((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === ordered.length - 1) return;
    setOrdered((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(ordered.map((w) => w.id));
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reorder Workouts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2">
          {ordered.map((workout, index) => (
            <div
              key={workout.id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <span className="flex-1 font-medium text-gray-900 dark:text-white text-sm">
                {workout.name}
              </span>
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === ordered.length - 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </>
  );
}
