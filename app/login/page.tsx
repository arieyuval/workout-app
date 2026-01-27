'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from '../components/Footer';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
              // Store weight data in user metadata for later saving
              initial_weight: currentWeight ? parseFloat(currentWeight) : null,
              goal_weight: goalWeight ? parseFloat(goalWeight) : null,
            },
          },
        });

        if (error) throw error;

        // Sign up successful, redirect to home
        // Weight data will be saved on first page load via API
        router.push('/');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="flex flex-col items-center max-w-md w-full">
        {/* Tagline at top */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 text-center">
          The easiest way to track your lifts and achieve progressive overload
        </p>

        {/* Logo with curved text around it */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-10">
          {/* Curved text */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <defs>
              <path
                id="curveTop"
                d="M 20,100 A 80,80 0 0,1 180,100"
                fill="none"
              />
              <path
                id="curveBottom"
                d="M 20,100 A 80,80 0 0,0 180,100"
                fill="none"
              />
            </defs>
            <text className="fill-gray-900 dark:fill-white" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
                Plates
              </textPath>
            </text>
            <text className="fill-gray-900 dark:fill-white" style={{ fontSize: '14px', fontWeight: 'bold' }}>
              <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                The lifter&apos;s database
              </textPath>
            </text>
          </svg>

          {/* Centered logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/plates-logo.png"
              alt="Plates Logo"
              width={160}
              height={160}
              className="w-36 h-36 sm:w-40 sm:h-40"
              priority
            />
          </div>
        </div>

        {/* Sign in section */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            {isSignUp ? 'Sign up' : 'Sign in'}
          </h2>

          <form method="post" className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Track your body weight progress (optional)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  This is for your personal body weight tracking. You can add weigh-ins and monitor your progress over time.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="currentWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Weight (lbs)
                    </label>
                    <input
                      id="currentWeight"
                      name="currentWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="e.g., 180"
                    />
                  </div>
                  <div>
                    <label htmlFor="goalWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Goal Weight (lbs)
                    </label>
                    <input
                      id="goalWeight"
                      name="goalWeight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      placeholder="e.g., 170"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
                setName('');
                setCurrentWeight('');
                setGoalWeight('');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
