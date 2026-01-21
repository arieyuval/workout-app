'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Target, Pencil, Check, X } from 'lucide-react';
import NavBar from '../components/NavBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import type { BodyWeightLog, UserProfile } from '@/lib/types';

// Cache for weight data to prevent refetching on every navigation
const STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds
let cachedLogs: BodyWeightLog[] | null = null;
let cachedProfile: UserProfile | null = null;
let lastFetchedAt: number | null = null;

export default function WeightPage() {
  const [logs, setLogs] = useState<BodyWeightLog[]>(cachedLogs || []);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedLogs);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [goalWeight, setGoalWeight] = useState(cachedProfile?.goal_weight?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const fetchInProgress = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Skip if data is fresh and not forced
    if (!force && lastFetchedAt && Date.now() - lastFetchedAt < STALE_THRESHOLD_MS) {
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    // Only show loading spinner if we have no cached data
    if (!cachedLogs) {
      setLoading(true);
    }

    try {
      const [logsRes, profileRes] = await Promise.all([
        fetch('/api/weight-logs'),
        fetch('/api/profile'),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        cachedLogs = logsData;
        setLogs(logsData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        cachedProfile = profileData;
        setProfile(profileData);
        if (profileData.goal_weight) {
          setGoalWeight(profileData.goal_weight.toString());
        }
      }

      lastFetchedAt = Date.now();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || parseFloat(newWeight) <= 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/weight-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(newWeight),
          notes: newNotes || undefined,
        }),
      });

      if (response.ok) {
        const newLog = await response.json();
        const updatedLogs = [newLog, ...logs];
        cachedLogs = updatedLogs;
        setLogs(updatedLogs);
        const updatedProfile = profile ? { ...profile, current_weight: newLog.weight } : null;
        cachedProfile = updatedProfile;
        setProfile(updatedProfile);
        setNewWeight('');
        setNewNotes('');
      }
    } catch (error) {
      console.error('Error adding weight:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weigh-in?')) return;
    
    try {
      const response = await fetch(`/api/weight-logs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedLogs = logs.filter((log) => log.id !== id);
        cachedLogs = updatedLogs;
        setLogs(updatedLogs);
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const startEditingLog = (log: any) => {
    setEditingLogId(log.id);
    setEditWeight(log.weight.toString());
    setEditNotes(log.notes || '');
  };

  const cancelEditingLog = () => {
    setEditingLogId(null);
    setEditWeight('');
    setEditNotes('');
  };

  const handleUpdateLog = async (id: string) => {
    if (!editWeight || parseFloat(editWeight) <= 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/weight-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(editWeight),
          notes: editNotes || null,
        }),
      });

      if (response.ok) {
        const updatedLog = await response.json();
        const updatedLogs = logs.map((log) => log.id === id ? updatedLog : log);
        cachedLogs = updatedLogs;
        setLogs(updatedLogs);
        setEditingLogId(null);
        setEditWeight('');
        setEditNotes('');
      }
    } catch (error) {
      console.error('Error updating log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    const newGoalWeight = goalWeight ? parseFloat(goalWeight) : null;
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_weight: newGoalWeight,
          current_weight: profile?.current_weight,
        }),
      });

      if (response.ok) {
        const updatedProfile = profile ? { ...profile, goal_weight: newGoalWeight ?? undefined } : null;
        cachedProfile = updatedProfile;
        setProfile(updatedProfile);
        setIsEditingGoal(false);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Chart data - sorted oldest to newest for the chart
  const chartData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const goal = profile?.goal_weight;
    const starting = sortedLogs[0]?.weight;

    return sortedLogs.map((log, index) => {
      const prevWeight = index > 0 ? sortedLogs[index - 1].weight : log.weight;
      const change = log.weight - prevWeight;

      // Determine segment color based on goal direction
      let segmentColor = '#9CA3AF'; // gray default
      if (goal && starting) {
        if (goal > starting) {
          // Trying to gain weight - increase is good
          segmentColor = change >= 0 ? '#10B981' : '#EF4444'; // green if increase, red if decrease
        } else if (goal < starting) {
          // Trying to lose weight - decrease is good
          segmentColor = change <= 0 ? '#10B981' : '#EF4444'; // green if decrease, red if increase
        }
      } else {
        segmentColor = '#10B981'; // default green if no goal
      }

      return {
        date: format(new Date(log.date), 'MMM d'),
        weight: log.weight,
        fullDate: format(new Date(log.date), 'MMM d, yyyy'),
        segmentColor,
      };
    });
  }, [logs, profile?.goal_weight]);

  // Calculate Y-axis domain to include goal weight and all data points
  const yAxisDomain = useMemo(() => {
    const weights = logs.map((l) => l.weight);
    if (profile?.goal_weight) {
      weights.push(profile.goal_weight);
    }
    if (weights.length === 0) return [0, 200]; // Default range

    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 5; // 10% padding or 5 lbs minimum

    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [logs, profile?.goal_weight]);

  // Calculate stats
  const stats = useMemo(() => {
    if (logs.length === 0) return null;

    const weights = logs.map((l) => l.weight);
    const current = logs[0]?.weight; // Most recent (logs are sorted desc)
    const starting = logs[logs.length - 1]?.weight; // Oldest
    const highest = Math.max(...weights);
    const lowest = Math.min(...weights);
    const change = current - starting;

    return { current, starting, highest, lowest, change };
  }, [logs]);

  // Show chart if there's data OR a goal weight is set
  const showChart = chartData.length >= 1 || profile?.goal_weight;

  // Determine if goal has been reached (for goal line color)
  const goalReached = stats?.current && profile?.goal_weight && stats.current === profile.goal_weight;

  // Goal line color - green if reached, blue otherwise
  const goalLineColor = goalReached ? '#10B981' : '#3B82F6';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exercises
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Body Weight
          </h1>
        </div>
        {/* Stats Cards */}
        {(stats || profile?.goal_weight) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500 dark:text-gray-400">Starting</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.starting ? `${stats.starting} lbs` : '-'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Change</div>
              <div className={`text-xl font-bold ${
                (() => {
                  if (!stats?.change || stats.change === 0) return 'text-gray-900 dark:text-white';
                  const goal = profile?.goal_weight;
                  const starting = stats?.starting;
                  if (!goal || !starting) return 'text-gray-900 dark:text-white';
                  // If goal > starting (gaining), increase is green
                  if (goal > starting) {
                    return stats.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  }
                  // If goal < starting (losing), decrease is green
                  if (goal < starting) {
                    return stats.change < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  }
                  return 'text-gray-900 dark:text-white';
                })()
              }`}>
                {stats?.change !== undefined ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)} lbs` : '-'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
              <div className={`text-xl font-bold ${
                stats?.current && profile?.goal_weight && stats.current === profile.goal_weight
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {stats?.current ? `${stats.current} lbs` : '-'}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-md">
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Target className="w-3 h-3" />
                Goal
              </div>
              {isEditingGoal ? (
                <div className="flex flex-col gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                    placeholder="lbs"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateGoal}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingGoal(false);
                        setGoalWeight(profile?.goal_weight?.toString() || '');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingGoal(true)}
                  className="flex items-center gap-1 cursor-pointer group"
                  title="Click to edit"
                >
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                    {profile?.goal_weight ? `${profile.goal_weight} lbs` : 'Set goal'}
                  </span>
                  <Pencil className="w-3 h-3 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        {showChart ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress Over Time
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: '11px' }}
                    domain={yAxisDomain}
                    label={{ value: 'lbs', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '11px' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                    formatter={(value) => [`${value} lbs`, 'Weight']}
                    labelFormatter={(_, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullDate;
                      }
                      return '';
                    }}
                  />
                  {/* Goal weight reference line */}
                  {profile?.goal_weight && (
                    <ReferenceLine
                      y={profile.goal_weight}
                      stroke={goalLineColor}
                      strokeDasharray={goalReached ? undefined : '5 5'}
                      strokeWidth={2}
                      label={{
                        value: `Goal: ${profile.goal_weight}`,
                        position: 'right',
                        fill: goalLineColor,
                        fontSize: 11,
                      }}
                    />
                  )}
                  {/* Weight line */}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={goalReached ? '#10B981' : '#3B82F6'}
                    strokeWidth={2}
                    dot={{ fill: goalReached ? '#10B981' : '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
            No weigh-ins yet. Add your first one below!
          </div>
        )}

        {/* Add Weight Form */}
        <form onSubmit={handleAddWeight} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Log New Weigh-In
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Weight (lbs)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newWeight}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </form>

        {/* History */}
        {logs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Weigh-In History
            </h2>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  {editingLogId === log.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-24 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Weight"
                          autoFocus
                        />
                        <span className="text-sm text-gray-500">lbs</span>
                      </div>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Notes (optional)"
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.date), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateLog(log.id)}
                            disabled={isSubmitting || !editWeight}
                            className="p-1.5 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditingLog}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {log.weight} lbs
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.date), 'MMM d, yyyy h:mm a')}
                        </div>
                        {log.notes && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {log.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingLog(log)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
