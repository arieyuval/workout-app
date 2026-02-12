'use client';

import { useState, useMemo } from 'react';
import type { WorkoutSet } from '@/lib/types';
import { getSetStrengthScore } from '@/lib/strength-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Info } from 'lucide-react';

interface ProgressChartProps {
  sets: WorkoutSet[];
  usesBodyWeight?: boolean;
}

export default function ProgressChart({ sets, usesBodyWeight = false }: ProgressChartProps) {
  // For bodyweight exercises: show reps progression over time (best reps per day)
  // For regular exercises: show Strength Score (estimated 1RM) progression

  const [showInfo, setShowInfo] = useState(false);

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

  // Chart data for regular exercises: calculate Strength Score for every set, keep peak per day
  const regularChartData = useMemo(() => {
    if (usesBodyWeight) return [];

    const byDay = new Map<string, { score: number; weight: number; reps: number; date: string }>();

    sets.forEach((set) => {
      const result = getSetStrengthScore(set);
      if (!result) return;

      const dayKey = format(new Date(set.date), 'yyyy-MM-dd');
      const existing = byDay.get(dayKey);

      if (!existing || result.score > existing.score) {
        byDay.set(dayKey, {
          score: result.score,
          weight: result.weight,
          reps: result.reps,
          date: set.date,
        });
      }
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        date: format(new Date(data.date), 'MMM d'),
        strengthScore: data.score,
        weight: data.weight,
        reps: data.reps,
        fullDate: format(new Date(data.date), 'MMM d, yyyy'),
      }));
  }, [sets, usesBodyWeight]);

  const chartData = usesBodyWeight ? bodyweightChartData : regularChartData;

  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return undefined;

    if (usesBodyWeight) {
      const reps = chartData.map((d) => d.reps as number).filter((r) => r !== undefined);
      if (reps.length === 0) return undefined;
      const min = Math.min(...reps);
      const max = Math.max(...reps);
      const padding = (max - min) * 0.1 || 2;
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    } else {
      const scores = chartData.map((d) => (d as any).strengthScore as number).filter((s) => s !== undefined);
      if (scores.length === 0) return undefined;
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const padding = (max - min) * 0.1 || 5;
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    }
  }, [chartData, usesBodyWeight]);

  if (sets.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No data to display. Log some sets to see your progress!
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg">
      {/* Strength Score description + info icon - only for non-bodyweight exercises */}
      {!usesBodyWeight && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing peak Strength Score per day
            </p>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              title="What is Strength Score?"
              aria-label="Strength Score info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          {showInfo && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p className="font-medium text-gray-800 dark:text-gray-100">
                Strength Score (Estimated 1RM)
              </p>
              <p>Normalizes sets across all rep ranges into a single comparable score. These are the standard formulas used by many apps.</p>
              <p>1–10 reps: Weight × 36 / (37 − Reps) <span className="text-gray-400">(Brzycki)</span></p>
              <p>11+ reps: Weight × (1 + Reps / 30) <span className="text-gray-400">(Epley)</span></p>
              <p className="text-gray-400 italic">Higher score = stronger performance</p>
            </div>
          )}
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
            : 'No sets found.'}
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
                  value: usesBodyWeight ? 'Reps' : 'Strength Score',
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
                  if (name === 'strengthScore' && value !== undefined) {
                    return [`${value}`, 'Strength Score'];
                  }
                  return [value ?? '', name ?? ''];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    if (usesBodyWeight) {
                      return data.fullDate;
                    }
                    return `${data.fullDate} — ${data.weight} lbs × ${data.reps} reps`;
                  }
                  return label;
                }}
              />
              <Line
                type="monotone"
                dataKey={usesBodyWeight ? 'reps' : 'strengthScore'}
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
