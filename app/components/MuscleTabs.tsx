'use client';

import type { MuscleGroup } from '@/lib/types';

interface MuscleTabsProps {
  activeTab: MuscleGroup;
  onTabChange: (tab: MuscleGroup) => void;
}

const muscleGroups: MuscleGroup[] = ['All', 'Back', 'Arms', 'Chest', 'Shoulders', 'Legs', 'Core', 'Cardio'];

// Get background color for active pill based on muscle group
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
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {muscleGroups.map((group) => (
        <button
          key={group}
          onClick={() => onTabChange(group)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${
            activeTab === group
              ? `${getMuscleGroupBgColor(group)} text-white`
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {group}
        </button>
      ))}
    </div>
  );
}
