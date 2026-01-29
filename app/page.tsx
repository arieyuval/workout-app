'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MuscleTabs from './components/MuscleTabs';
import ExerciseCard from './components/ExerciseCard';
import CardioExerciseCard from './components/CardioExerciseCard';
import AddExerciseModal from './components/AddExerciseModal';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { useWorkoutData } from './context/WorkoutDataContext';
import type { MuscleGroup } from '@/lib/types';
import { exerciseMatchesMuscleTab, getMuscleGroups } from '@/lib/muscle-utils';

export default function Home() {
  const {
    exercises,
    sets,
    loading,
    fetchAllData,
    refreshExerciseSets,
    getTopSetLastSession,
    getLastSet,
    getLastSessionNotes,
    getCurrentMax,
    getBestDistance,
  } = useWorkoutData();

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('activeExerciseTab', activeTab);
  }, [activeTab]);

  // Initialize user profile and fetch data on mount (uses cache if fresh)
  useEffect(() => {
    // Try to init profile from signup metadata (silent, fire-and-forget)
    fetch('/api/profile/init', { method: 'POST' }).catch(() => {});

    fetchAllData();
  }, [fetchAllData]);

  // Smart visibility change - only refetch if data is stale (handled by context)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData(); // Context checks staleness internally
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAllData]);

  // Filter and sort exercises based on active tab, search query, and set count
  const filteredExercises = useMemo(() => {
    return exercises
      .filter((exercise) => {
        // Use utility function for muscle group matching
        const matchesTab = exerciseMatchesMuscleTab(exercise, activeTab);

        const matchesSearch =
          searchQuery === '' ||
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          // Also search in all muscle groups for multi-muscle exercises
          getMuscleGroups(exercise).some(mg =>
            mg.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by number of sets logged (most to least)
        const aSets = sets[a.id]?.length || 0;
        const bSets = sets[b.id]?.length || 0;
        return bSets - aSets;
      });
  }, [exercises, activeTab, searchQuery, sets]);

  // Refresh sets for a specific exercise after logging
  const handleSetLogged = async (exerciseId: string) => {
    await refreshExerciseSets(exerciseId);
  };

  // Handle search - automatically switch to "All" tab when searching
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setActiveTab('All');
    }
  };

  // Handle when a new exercise is added
  const handleExerciseAdded = () => {
    fetchAllData(true); // Force refresh to get the new exercise
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
      <NavBar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
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
                    lastSessionNotes={getLastSessionNotes(exercise.id)}
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
                    lastSessionNotes={getLastSessionNotes(exercise.id)}
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
        onExerciseAdded={handleExerciseAdded}
      />

      {/* Footer */}
      <Footer />
    </>
  );
}
