'use client';

import { useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface CardioPaceChartProps {
  sets: WorkoutSet[];
}

export default function CardioPaceChart({ sets }: CardioPaceChartProps) {
  // Filter sets that have both distance and duration
  // Then group by day and pick the best pace (lowest) for each day
  const chartData = useMemo(() => {
    const validSets = sets.filter(
      (set) => set.distance && set.duration && set.distance > 0
    );

    // Group by day (using date string without time)
    const byDay = new Map<string, WorkoutSet>();
    validSets.forEach((set) => {
      const dayKey = format(new Date(set.date), 'yyyy-MM-dd');
      const existing = byDay.get(dayKey);
      const currentPace = set.duration! / set.distance!;

      if (!existing) {
        byDay.set(dayKey, set);
      } else {
        const existingPace = existing.duration! / existing.distance!;
        // Keep the set with better (lower) pace
        if (currentPace < existingPace) {
          byDay.set(dayKey, set);
        }
      }
    });

    // Convert to array and sort by date (oldest first)
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, set]) => ({
        date: format(new Date(set.date), 'MMM d'),
        pace: Number((set.duration! / set.distance!).toFixed(2)),
        distance: set.distance,
        duration: set.duration,
        fullDate: format(new Date(set.date), 'MMM d, yyyy'),
      }));
  }, [sets]);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data to display. Log some sessions to see your pace progress!
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white dark:bg-gray-800 p-4 rounded-lg">
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
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            label={{ value: 'Pace (min/mi)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
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
              if (name === 'pace' && value !== undefined) return [`${value} min/mi`, 'Pace'];
              return [value ?? '', name ?? ''];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload;
                return `${data.fullDate} - ${data.distance} mi in ${data.duration} min`;
              }
              return label;
            }}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
