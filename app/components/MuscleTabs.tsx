'use client';

import type { MuscleGroup } from '@/lib/types';

interface MuscleTabsProps {
  activeTab: MuscleGroup;
  onTabChange: (tab: MuscleGroup) => void;
}

const muscleGroups: MuscleGroup[] = ['All', 'Back', 'Arms', 'Chest', 'Shoulders', 'Legs', 'Core', 'Cardio'];

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
                ? 'bg-blue-600 text-white shadow-md'
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
