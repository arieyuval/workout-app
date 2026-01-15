'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MuscleTabs from './components/MuscleTabs';
import ExerciseCard from './components/ExerciseCard';
import CardioExerciseCard from './components/CardioExerciseCard';
import AddExerciseModal from './components/AddExerciseModal';
import type { Exercise, WorkoutSet, MuscleGroup } from '@/lib/types';

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>({});
  const [activeTab, setActiveTab] = useState<MuscleGroup>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch exercises data
  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises');
      const data = await response.json();
      setExercises(data);

      // Fetch sets for all exercises in parallel
      const setsPromises = data.map(async (exercise: Exercise) => {
        const response = await fetch(`/api/sets?exercise_id=${exercise.id}`);
        const exerciseSets = await response.json();
        return { id: exercise.id, sets: exerciseSets };
      });

      const setsResults = await Promise.all(setsPromises);

      // Convert array to Record
      const setsData: Record<string, WorkoutSet[]> = {};
      for (const result of setsResults) {
        setsData[result.id] = result.sets;
      }
      setSets(setsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch exercises on mount
  useEffect(() => {
    fetchExercises();
  }, []);

  // Refresh exercises when page becomes visible (e.g., navigating back from detail page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchExercises();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filter exercises based on active tab and search query
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesTab = activeTab === 'All' || exercise.muscle_group === activeTab;
      const matchesSearch =
        searchQuery === '' ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [exercises, activeTab, searchQuery]);

  // Helper to get last set (excluding today) for an exercise
  const getLastSet = (exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const previousSets = exerciseSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate < today;
    });

    return previousSets.length > 0 ? previousSets[0] : null;
  };

  // Helper to get current max for default PR reps (strength exercises)
  const getCurrentMax = (exerciseId: string, defaultPrReps: number): number | null => {
    const exerciseSets = sets[exerciseId] || [];
    const validSets = exerciseSets.filter((set) => set.reps !== undefined && set.reps >= defaultPrReps);

    if (validSets.length === 0) return null;

    return Math.max(...validSets.map((set) => set.weight!));
  };

  // Helper to get best distance for cardio exercises
  const getBestDistance = (exerciseId: string): number | null => {
    const exerciseSets = sets[exerciseId] || [];
    const validSets = exerciseSets.filter((set) => set.distance !== undefined && set.distance > 0);

    if (validSets.length === 0) return null;

    return Math.max(...validSets.map((set) => set.distance!));
  };

  // Refresh sets for a specific exercise after logging
  const handleSetLogged = async (exerciseId: string) => {
    try {
      const setsResponse = await fetch(`/api/sets?exercise_id=${exerciseId}`);
      const exerciseSets = await setsResponse.json();
      setSets((prev) => ({
        ...prev,
        [exerciseId]: exerciseSets,
      }));
    } catch (error) {
      console.error('Error refreshing sets:', error);
    }
  };

  // Handle search - automatically switch to "All" tab when searching
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setActiveTab('All');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Workout Tracker
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your lifts and monitor your progress
          </p>
        </header>

        {/* Search Bar */}
        <SearchBar onSearchChange={handleSearchChange} />

        {/* Muscle Group Tabs */}
        <MuscleTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Exercise Grid */}
        {filteredExercises.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            {searchQuery ? 'No exercises found matching your search.' : 'No exercises in this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredExercises.map((exercise) => {
              if (exercise.exercise_type === 'cardio') {
                return (
                  <CardioExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    lastSet={getLastSet(exercise.id)}
                    bestDistance={getBestDistance(exercise.id)}
                    onSetLogged={() => handleSetLogged(exercise.id)}
                  />
                );
              } else {
                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    lastSet={getLastSet(exercise.id)}
                    currentMax={getCurrentMax(exercise.id, exercise.default_pr_reps)}
                    onSetLogged={() => handleSetLogged(exercise.id)}
                  />
                );
              }
            })}
          </div>
        )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 touch-manipulation"
        aria-label="Add new exercise"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={fetchExercises}
      />
    </>
  );
}
