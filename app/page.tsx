'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Settings, Pencil } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MuscleTabs from './components/MuscleTabs';
import ViewToggle from './components/ViewToggle';
import WorkoutSection from './components/WorkoutSection';
import ManageWorkoutsModal from './components/ManageWorkoutsModal';
import ExerciseCard from './components/ExerciseCard';
import CardioExerciseCard from './components/CardioExerciseCard';
import AddExerciseModal from './components/AddExerciseModal';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { useWorkoutData } from './context/WorkoutDataContext';
import type { MuscleGroup, ExerciseWithUserData } from '@/lib/types';
import { exerciseMatchesMuscleTab, getMuscleGroups } from '@/lib/muscle-utils';

type ViewMode = 'muscles' | 'workouts';

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
    workouts,
    getWorkoutExercises,
    unassignedExercises,
  } = useWorkoutData();

  const [activeTab, setActiveTab] = useState<MuscleGroup>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('activeExerciseTab');
      if (savedTab) {
        return savedTab as MuscleGroup;
      }
    }
    return 'All';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('exerciseViewMode');
      if (saved === 'muscles' || saved === 'workouts') return saved;
    }
    return 'muscles';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageWorkoutsOpen, setIsManageWorkoutsOpen] = useState(false);
  const [activeWorkoutTab, setActiveWorkoutTab] = useState<string>('');
  const [manageModalMode, setManageModalMode] = useState<'list' | 'edit' | 'create'>('list');
  const [manageModalWorkoutId, setManageModalWorkoutId] = useState<string | null>(null);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('activeExerciseTab', activeTab);
  }, [activeTab]);

  // Persist view mode to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('exerciseViewMode', viewMode);
  }, [viewMode]);

  // Initialize user profile and fetch data on mount (uses cache if fresh)
  useEffect(() => {
    fetch('/api/profile/init', { method: 'POST' }).catch(() => {});
    fetchAllData();
  }, [fetchAllData]);

  // Smart visibility change - only refetch if data is stale (handled by context)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAllData]);

  // Ensure active workout tab is valid and set default
  useEffect(() => {
    if (viewMode === 'workouts') {
      const isValid = workouts.some(w => w.id === activeWorkoutTab) || (activeWorkoutTab === 'other' && unassignedExercises.length > 0);
      
      if (!isValid) {
        if (workouts.length > 0) {
          setActiveWorkoutTab(workouts[0].id);
        } else if (unassignedExercises.length > 0) {
          setActiveWorkoutTab('other');
        } else {
          setActiveWorkoutTab('');
        }
      }
    }
  }, [viewMode, workouts, unassignedExercises, activeWorkoutTab]);

  // Capture set counts at session start for stable sort order
  // (prevents cards from jumping around as sets are logged)
  const sortSetCountsRef = useRef<Record<string, number> | null>(null);
  if (sortSetCountsRef.current === null && Object.keys(sets).length > 0) {
    const counts: Record<string, number> = {};
    for (const [id, exerciseSets] of Object.entries(sets)) {
      counts[id] = exerciseSets.length;
    }
    sortSetCountsRef.current = counts;
  }
  const sortSetCounts = sortSetCountsRef.current || {};

  // Search filter helper
  const matchesSearch = (exercise: ExerciseWithUserData) => {
    if (searchQuery === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      exercise.name.toLowerCase().includes(q) ||
      getMuscleGroups(exercise).some((mg) => mg.toLowerCase().includes(q))
    );
  };

  // Filter and sort exercises for muscle group view
  const filteredExercises = useMemo(() => {
    return exercises
      .filter((exercise) => {
        const matchesTab = exerciseMatchesMuscleTab(exercise, activeTab);
        return matchesTab && matchesSearch(exercise);
      })
      .sort((a, b) => {
        const aSets = sortSetCounts[a.id] || 0;
        const bSets = sortSetCounts[b.id] || 0;
        return bSets - aSets;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, activeTab, searchQuery, sortSetCounts]);

  // Refresh sets for a specific exercise after logging
  const handleSetLogged = async (exerciseId: string) => {
    await refreshExerciseSets(exerciseId);
  };

  // Handle search - automatically switch to "All" tab when searching (muscles view)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '' && viewMode === 'muscles') {
      setActiveTab('All');
    }
  };

  // Handle when a new exercise is added
  const handleExerciseAdded = () => {
    fetchAllData(true);
  };

  const openManageModal = (mode: 'list' | 'edit' | 'create', workoutId: string | null = null) => {
    setManageModalMode(mode);
    setManageModalWorkoutId(workoutId);
    setIsManageWorkoutsOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-dumbbell"
            viewBox="0 0 64 64"
            fill="currentColor"
          >
            <rect x="4" y="20" width="8" height="24" rx="2" />
            <rect x="14" y="24" width="6" height="16" rx="1" />
            <rect x="20" y="29" width="24" height="6" rx="1" />
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

        {/* View Toggle */}
        <ViewToggle activeView={viewMode} onViewChange={setViewMode} />

        {viewMode === 'muscles' ? (
          <>
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
                        currentMax={getCurrentMax(exercise.id, exercise.user_pr_reps ?? 3)}
                        lastSessionNotes={getLastSessionNotes(exercise.id)}
                        onSetLogged={() => handleSetLogged(exercise.id)}
                      />
                    );
                  }
                })}
              </div>
            )}
          </>
        ) : (
          /* Workout View */
          <>
            {/* Workout Pills Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {workouts.map(w => (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkoutTab(w.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeWorkoutTab === w.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {w.name}
                </button>
              ))}
              
              {unassignedExercises.length > 0 && (
                <button
                  onClick={() => setActiveWorkoutTab('other')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeWorkoutTab === 'other'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Other
                </button>
              )}

              <button
                onClick={() => openManageModal('create')}
                className="p-2 rounded-full bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex-shrink-0"
                title="Add Workout"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Workout Sections */}
            {workouts.length === 0 && unassignedExercises.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                No exercises yet. Add some exercises to get started.
              </div>
            ) : (
              <>
                {(() => {
                  if (activeWorkoutTab === 'other') {
                    return (
                      <WorkoutSection
                        title="Other"
                        exercises={unassignedExercises.filter(matchesSearch)}
                        sets={sets}
                        getTopSetLastSession={getTopSetLastSession}
                        getLastSet={getLastSet}
                        getLastSessionNotes={getLastSessionNotes}
                        getCurrentMax={getCurrentMax}
                        getBestDistance={getBestDistance}
                        onSetLogged={handleSetLogged}
                      />
                    );
                  }

                  const activeWorkout = workouts.find(w => w.id === activeWorkoutTab);
                  if (!activeWorkout) return null;

                  const workoutExercises = getWorkoutExercises(activeWorkout.id).filter(matchesSearch);

                  return (
                    <>
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => openManageModal('edit', activeWorkout.id)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit Workout
                        </button>
                      </div>
                      <WorkoutSection
                        key={activeWorkout.id}
                        title={activeWorkout.name}
                        exercises={workoutExercises}
                        sets={sets}
                        getTopSetLastSession={getTopSetLastSession}
                        getLastSet={getLastSet}
                        getLastSessionNotes={getLastSessionNotes}
                        getCurrentMax={getCurrentMax}
                        getBestDistance={getBestDistance}
                        onSetLogged={handleSetLogged}
                      />
                    </>
                  );
                })()}
              </>
            )}
          </>
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

      {/* Manage Workouts Modal */}
      <ManageWorkoutsModal
        isOpen={isManageWorkoutsOpen}
        onClose={() => setIsManageWorkoutsOpen(false)}
        initialView={manageModalMode}
        initialWorkoutId={manageModalWorkoutId}
      />

      {/* Footer */}
      <Footer />
    </>
  );
}
