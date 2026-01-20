import { redirect } from 'next/navigation';
import ExercisePageClient from '@/app/components/ExercisePageClient';
import { getUser } from '@/lib/supabase-server';

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get authenticated user - still need server-side auth check
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Render client component that uses cached data
  return <ExercisePageClient exerciseId={id} />;
}
