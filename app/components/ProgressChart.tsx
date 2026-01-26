'use client';

import { useState, useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface ProgressChartProps {
  sets: WorkoutSet[];
  usesBodyWeight?: boolean;
  goalWeight?: number | null;
  goalReps?: number | null;
}

export default function ProgressChart({ sets, usesBodyWeight = false, goalWeight, goalReps }: ProgressChartProps) {
  // For bodyweight exercises: show reps progression over time (best reps per day)
  // For regular exercises: show weight progression for a specific rep count

  // Get unique rep counts from the data for the dropdown (only for non-bodyweight exercises)
  const availableReps = useMemo(() => {
    if (usesBodyWeight) return [];
    const reps = new Set<number>();
    sets.forEach((set) => {
      if (set.reps !== undefined && set.reps > 0) {
        reps.add(set.reps);
      }
    });
    return Array.from(reps).sort((a, b) => a - b);
  }, [sets, usesBodyWeight]);

  const [selectedReps, setSelectedReps] = useState<number | null>(
    availableReps.length > 0 ? availableReps[0] : null
  );

  // Chart data for bodyweight exercises: group by day, show max reps
  const bodyweightChartData = useMemo(() => {
    if (!usesBodyWeight) return [];

    // Group by day and pick the best reps for each day
    const byDay = new Map<string, WorkoutSet>();
    sets.forEach((set) => {
      if (set.reps === undefined || set.reps <= 0) return;
      const dayKey = format(new Date(set.date), 'yyyy-MM-dd');
      const existing = byDay.get(dayKey);
      if (!existing || set.reps > (existing.reps ?? 0)) {
        byDay.set(dayKey, set);
      }
    });

    // Convert to array and sort by date (oldest first)
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, set]) => ({
        date: format(new Date(set.date), 'MMM d'),
        reps: set.reps,
        fullDate: format(new Date(set.date), 'MMM d, yyyy'),
      }));
  }, [sets, usesBodyWeight]);

  // Chart data for regular exercises: filter by rep count (or more), group by day, show max weight
  const regularChartData = useMemo(() => {
    if (usesBodyWeight || selectedReps === null) return [];

    // Filter sets with selectedReps or more
    const filteredSets = sets.filter(
      (set) => set.reps !== undefined && set.reps >= selectedReps && set.weight !== undefined
    );

    // Group by day (using date string without time)
    const byDay = new Map<string, WorkoutSet>();
    filteredSets.forEach((set) => {
      const dayKey = format(new Date(set.date), 'yyyy-MM-dd');
      const existing = byDay.get(dayKey);
      if (!existing || (set.weight! > existing.weight!)) {
        byDay.set(dayKey, set);
      }
    });

    // Convert to array and sort by date (oldest first)
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, set]) => ({
        date: format(new Date(set.date), 'MMM d'),
        weight: set.weight,
        reps: set.reps,
        fullDate: format(new Date(set.date), 'MMM d, yyyy'),
      }));
  }, [sets, selectedReps, usesBodyWeight]);

  const chartData = usesBodyWeight ? bodyweightChartData : regularChartData;

  // Calculate Y-axis domain to include goal (weight for strength, reps for bodyweight)
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return undefined;

    if (usesBodyWeight) {
      const reps = chartData.map((d) => d.reps as number).filter((r) => r !== undefined);
      if (goalReps) {
        reps.push(goalReps);
      }
      if (reps.length === 0) return undefined;
      const min = Math.min(...reps);
      const max = Math.max(...reps);
      const padding = (max - min) * 0.1 || 2;
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    } else {
      const weights = chartData.map((d) => d.weight as number).filter((w) => w !== undefined);
      if (goalWeight) {
        weights.push(goalWeight);
      }
      if (weights.length === 0) return undefined;
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      const padding = (max - min) * 0.1 || 5;
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    }
  }, [chartData, goalWeight, goalReps, usesBodyWeight]);

  // Determine if goal has been reached (for goal line color)
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return null;
    if (usesBodyWeight) {
      const reps = chartData.map((d) => d.reps as number).filter((r) => r !== undefined);
      return reps.length > 0 ? Math.max(...reps) : null;
    } else {
      const weights = chartData.map((d) => d.weight as number).filter((w) => w !== undefined);
      return weights.length > 0 ? Math.max(...weights) : null;
    }
  }, [chartData, usesBodyWeight]);

  const goalReached = usesBodyWeight
    ? maxValue !== null && goalReps && maxValue >= goalReps
    : maxValue !== null && goalWeight && maxValue >= goalWeight;
  const goalLineColor = goalReached ? '#10B981' : '#3B82F6'; // green if reached, blue otherwise

  // For bodyweight exercises, check if there are any sets
  // For regular exercises, check if there are available rep counts
  if (sets.length === 0 || (!usesBodyWeight && availableReps.length === 0)) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data to display. Log some sets to see your progress!
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg">
      {/* Rep selector - only for non-bodyweight exercises */}
      {!usesBodyWeight && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Show sets with
          </label>
          <select
            value={selectedReps ?? ''}
            onChange={(e) => setSelectedReps(Number(e.target.value))}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableReps.map((reps) => (
              <option key={reps} value={reps}>
                {reps}+ reps
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bodyweight description */}
      {usesBodyWeight && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing max reps per day
          </p>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {usesBodyWeight
            ? 'No sets found.'
            : `No sets found with ${selectedReps}+ reps.`}
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                domain={yAxisDomain}
                label={{
                  value: usesBodyWeight ? 'Reps' : 'Weight (lbs)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value, name) => {
                  if (usesBodyWeight && name === 'reps' && value !== undefined) {
                    return [`${value} reps`, 'Reps'];
                  }
                  if (name === 'weight' && value !== undefined) return [`${value} lbs`, 'Weight'];
                  return [value ?? '', name ?? ''];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    if (usesBodyWeight) {
                      return data.fullDate;
                    }
                    return `${data.fullDate} - ${data.reps} reps`;
                  }
                  return label;
                }}
              />
              {/* Goal reference line (weight for strength, reps for bodyweight) */}
              {!usesBodyWeight && goalWeight && (
                <ReferenceLine
                  y={goalWeight}
                  stroke={goalLineColor}
                  strokeDasharray={goalReached ? undefined : '5 5'}
                  strokeWidth={2}
                  label={{
                    value: `Goal: ${goalWeight}`,
                    position: 'right',
                    fill: goalLineColor,
                    fontSize: 11,
                  }}
                />
              )}
              {usesBodyWeight && goalReps && (
                <ReferenceLine
                  y={goalReps}
                  stroke={goalLineColor}
                  strokeDasharray={goalReached ? undefined : '5 5'}
                  strokeWidth={2}
                  label={{
                    value: `Goal: ${goalReps}`,
                    position: 'right',
                    fill: goalLineColor,
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey={usesBodyWeight ? 'reps' : 'weight'}
                stroke={goalReached ? '#10B981' : '#3B82F6'}
                strokeWidth={2}
                dot={{ fill: goalReached ? '#10B981' : '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
