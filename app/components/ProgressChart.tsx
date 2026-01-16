'use client';

import { useState, useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ProgressChartProps {
  sets: WorkoutSet[];
}

export default function ProgressChart({ sets }: ProgressChartProps) {
  // Get unique rep counts from the data for the dropdown
  const availableReps = useMemo(() => {
    const reps = new Set<number>();
    sets.forEach((set) => {
      if (set.reps !== undefined && set.reps > 0) {
        reps.add(set.reps);
      }
    });
    return Array.from(reps).sort((a, b) => a - b);
  }, [sets]);

  const [selectedReps, setSelectedReps] = useState<number | null>(
    availableReps.length > 0 ? availableReps[0] : null
  );

  // Filter sets by exact rep count
  // Then group by day and pick the best weight for each day
  const chartData = useMemo(() => {
    if (selectedReps === null) return [];

    // Filter sets with exactly selectedReps
    const filteredSets = sets.filter(
      (set) => set.reps !== undefined && set.reps === selectedReps && set.weight !== undefined
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
  }, [sets, selectedReps]);

  if (sets.length === 0 || availableReps.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data to display. Log some sets to see your progress!
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg">
      {/* Rep selector */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Show sets with exactly
        </label>
        <select
          value={selectedReps ?? ''}
          onChange={(e) => setSelectedReps(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableReps.map((reps) => (
            <option key={reps} value={reps}>
              {reps} {reps === 1 ? 'rep' : 'reps'}
            </option>
          ))}
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No sets found with exactly {selectedReps} {selectedReps === 1 ? 'rep' : 'reps'}.
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
                label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
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
                  if (name === 'weight' && value !== undefined) return [`${value} lbs`, 'Weight'];
                  return [value ?? '', name ?? ''];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return `${data.fullDate} - ${data.reps} reps`;
                  }
                  return label;
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
