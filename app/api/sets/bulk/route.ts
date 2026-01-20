import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { WorkoutSet } from '@/lib/types';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch ALL sets for this user
    const { data: sets, error } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching bulk sets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sets' },
        { status: 500 }
      );
    }

    // Group by exercise_id
    const grouped: Record<string, WorkoutSet[]> = {};
    for (const set of sets || []) {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = [];
      }
      grouped[set.exercise_id].push(set);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error in GET /api/sets/bulk:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}
