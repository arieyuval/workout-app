'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, History } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MuscleTabs from './components/MuscleTabs';
import ExerciseCard from './components/ExerciseCard';
import CardioExerciseCard from './components/CardioExerciseCard';
import AddExerciseModal from './components/AddExerciseModal';
import UserMenu from './components/UserMenu';
import type { Exercise, WorkoutSet, MuscleGroup } from '@/lib/types';

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>({});
  const [activeTab, setActiveTab] = useState<MuscleGroup>(() => {
    // Restore tab from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('activeExerciseTab');
      if (savedTab) {
        return savedTab as MuscleGroup;
      }
    }
    return 'All';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('activeExerciseTab', activeTab);
  }, [activeTab]);

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

  // Initialize user profile (for new signups with weight data) and fetch exercises on mount
  useEffect(() => {
    // Try to init profile from signup metadata (silent, fire-and-forget)
    fetch('/api/profile/init', { method: 'POST' }).catch(() => {});

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

  // Filter and sort exercises based on active tab, search query, and set count
  const filteredExercises = useMemo(() => {
    return exercises
      .filter((exercise) => {
        const matchesTab = activeTab === 'All' || exercise.muscle_group === activeTab;
        const matchesSearch =
          searchQuery === '' ||
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by number of sets logged (most to least)
        const aSets = sets[a.id]?.length || 0;
        const bSets = sets[b.id]?.length || 0;
        return bSets - aSets;
      });
  }, [exercises, activeTab, searchQuery, sets]);

  // Helper to get the top (heaviest) set from the last session (excluding today)
  const getTopSetLastSession = (exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to sets before today
    const previousSets = exerciseSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate < today;
    });

    if (previousSets.length === 0) return null;

    // Find the most recent date (last session)
    const lastSessionDate = new Date(previousSets[0].date);
    lastSessionDate.setHours(0, 0, 0, 0);

    // Get all sets from that day
    const lastSessionSets = previousSets.filter((set) => {
      const setDate = new Date(set.date);
      setDate.setHours(0, 0, 0, 0);
      return setDate.getTime() === lastSessionDate.getTime();
    });

    // Find the set with the highest weight
    return lastSessionSets.reduce((max, set) =>
      (set.weight ?? 0) > (max.weight ?? 0) ? set : max
    , lastSessionSets[0]);
  };

  // Helper to get the most recent set logged (including today)
  const getLastSet = (exerciseId: string): WorkoutSet | null => {
    const exerciseSets = sets[exerciseId] || [];
    return exerciseSets.length > 0 ? exerciseSets[0] : null;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          {/* Dumbbell SVG */}
          <svg
            className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-dumbbell"
            viewBox="0 0 64 64"
            fill="currentColor"
          >
            {/* Left weight plates */}
            <rect x="4" y="20" width="8" height="24" rx="2" />
            <rect x="14" y="24" width="6" height="16" rx="1" />
            {/* Bar */}
            <rect x="20" y="29" width="24" height="6" rx="1" />
            {/* Right weight plates */}
            <rect x="44" y="24" width="6" height="16" rx="1" />
            <rect x="52" y="20" width="8" height="24" rx="2" />
          </svg>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse-slow">
            Loading your workouts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex justify-between mb-2">
            <Link
              href="/history"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Workout history"
            >
              <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <UserMenu />
          </div>
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
                    topSetLastSession={getTopSetLastSession(exercise.id)}
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
