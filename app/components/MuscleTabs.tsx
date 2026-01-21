'use client';

import type { MuscleGroup } from '@/lib/types';

interface MuscleTabsProps {
  activeTab: MuscleGroup;
  onTabChange: (tab: MuscleGroup) => void;
}

const muscleGroups: MuscleGroup[] = ['All', 'Back', 'Arms', 'Chest', 'Shoulders', 'Legs', 'Core', 'Cardio'];

// Get background color for active tab based on muscle group (darker/gentler shades)
const getMuscleGroupBgColor = (muscleGroup: MuscleGroup): string => {
  const colors: Record<string, string> = {
    All: 'bg-gray-600',
    Chest: 'bg-rose-700',
    Back: 'bg-blue-600',
    Legs: 'bg-green-700',
    Shoulders: 'bg-amber-700',
    Arms: 'bg-purple-600',
    Biceps: 'bg-violet-600',
    Triceps: 'bg-fuchsia-600',
    Core: 'bg-yellow-700',
    Cardio: 'bg-teal-600',
  };
  return colors[muscleGroup] || 'bg-gray-600';
};

export default function MuscleTabs({ activeTab, onTabChange }: MuscleTabsProps) {
  return (
    <div className="mb-6 sm:mb-8 -mx-3 sm:mx-0 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max md:justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 sm:px-1">
        {muscleGroups.map((group) => (
          <button
            key={group}
            onClick={() => onTabChange(group)}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-medium transition-all touch-manipulation ${
              activeTab === group
                ? `${getMuscleGroupBgColor(group)} text-white shadow-md`
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600'
            }`}
          >
            {group}
          </button>
        ))}
      </div>
    </div>
  );
}
