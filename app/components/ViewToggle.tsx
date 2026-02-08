'use client';

interface ViewToggleProps {
  activeView: 'muscles' | 'workouts';
  onViewChange: (view: 'muscles' | 'workouts') => void;
}

export default function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="mb-4 sm:mb-6 flex justify-center">
      <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => onViewChange('muscles')}
          className={`px-4 sm:px-6 py-2 rounded-md font-medium text-sm transition-all touch-manipulation ${
            activeView === 'muscles'
              ? 'bg-gray-600 text-white shadow-md'
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Muscles
        </button>
        <button
          onClick={() => onViewChange('workouts')}
          className={`px-4 sm:px-6 py-2 rounded-md font-medium text-sm transition-all touch-manipulation ${
            activeView === 'workouts'
              ? 'bg-gray-600 text-white shadow-md'
              : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Workouts
        </button>
      </div>
    </div>
  );
}
