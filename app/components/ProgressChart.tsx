'use client';

import type { WorkoutSet } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ProgressChartProps {
  sets: WorkoutSet[];
}

export default function ProgressChart({ sets }: ProgressChartProps) {
  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data to display. Log some sets to see your progress!
      </div>
    );
  }

  // Prepare data for chart (reverse to show oldest to newest)
  const chartData = [...sets]
    .reverse()
    .map((set) => ({
      date: format(new Date(set.date), 'MMM d'),
      weight: set.weight,
      reps: set.reps,
      fullDate: format(new Date(set.date), 'MMM d, yyyy h:mm a'),
    }));

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
  );
}
