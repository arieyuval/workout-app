'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Scale, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import type { BodyWeightLog, UserProfile } from '@/lib/types';

interface BodyWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BodyWeightModal({ isOpen, onClose }: BodyWeightModalProps) {
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, profileRes] = await Promise.all([
        fetch('/api/weight-logs'),
        fetch('/api/profile'),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        if (profileData.goal_weight) {
          setGoalWeight(profileData.goal_weight.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setNewWeight('');
        setNewNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error adding weight:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const response = await fetch(`/api/weight-logs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_weight: goalWeight ? parseFloat(goalWeight) : null,
          current_weight: profile?.current_weight,
        }),
      });

      if (response.ok) {
        setIsEditingGoal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Chart data - sorted oldest to newest for the chart
  const chartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((log) => ({
        date: format(new Date(log.date), 'MMM d'),
        weight: log.weight,
        fullDate: format(new Date(log.date), 'MMM d, yyyy'),
      }));
  }, [logs]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Body Weight Tracking
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards - Order: Starting, Current, Change, Goal */}
              {(stats || profile?.goal_weight) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Starting</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats?.starting ? `${stats.starting} lbs` : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats?.current ? `${stats.current} lbs` : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Change</div>
                    <div className={`text-lg font-bold ${stats?.change && stats.change < 0 ? 'text-green-600 dark:text-green-400' : stats?.change && stats.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {stats?.change !== undefined ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)} lbs` : '-'}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <Target className="w-3 h-3" />
                      Goal
                    </div>
                    {isEditingGoal ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.1"
                          value={goalWeight}
                          onChange={(e) => setGoalWeight(e.target.value)}
                          className="w-16 px-1 py-0.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                          placeholder="lbs"
                        />
                        <button
                          onClick={handleUpdateGoal}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingGoal(true)}
                        className="text-lg font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      >
                        {profile?.goal_weight ? `${profile.goal_weight} lbs` : 'Set goal'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chart - show if there's at least 1 data point OR a goal is set */}
              {showChart ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Progress Over Time
                  </h3>
                  <div className="w-full h-56">
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
                            stroke="#3B82F6"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{
                              value: `Goal: ${profile.goal_weight}`,
                              position: 'right',
                              fill: '#3B82F6',
                              fontSize: 11,
                            }}
                          />
                        )}
                        {chartData.length > 0 && (
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  No weigh-ins yet. Add your first one below!
                </div>
              )}

              {/* Add Weight Form */}
              <form onSubmit={handleAddWeight} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Log New Weigh-In
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Weight (lbs)"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newWeight}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </form>

              {/* History */}
              {logs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Recent Weigh-Ins
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {logs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {log.weight} lbs
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(log.date), 'MMM d, yyyy h:mm a')}
                            {log.notes && ` - ${log.notes}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
