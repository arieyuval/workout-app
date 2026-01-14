import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ExerciseDetail from '@/app/components/ExerciseDetail';
import { getExercise, getSetHistory, getPersonalRecords, getLastSet } from '@/lib/data-utils';

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch exercise data
  const exercise = await getExercise(id);

  if (!exercise) {
    notFound();
  }

  // Fetch sets and PRs
  const sets = await getSetHistory(id);
  const prs = await getPersonalRecords(id);
  const lastSet = await getLastSet(id, true); // Exclude today

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:text-gray-900 dark:active:text-white transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Exercises
          </Link>
        </div>
      </div>

      {/* Exercise Detail Component */}
      <ExerciseDetail
        exercise={exercise}
        initialSets={sets}
        initialPRs={prs}
        lastSet={lastSet}
      />
    </div>
  );
}
