import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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

    // Fetch all sets for the user with exercise details
    const { data: sets, error } = await supabase
      .from('sets')
      .select('*, exercises(name, muscle_group, exercise_type)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all sets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sets' },
        { status: 500 }
      );
    }

    // Transform the data to flatten exercise info
    const transformedSets = (sets || []).map((set) => ({
      ...set,
      exercise_name: set.exercises?.name,
      muscle_group: set.exercises?.muscle_group,
      exercise_type: set.exercises?.exercise_type,
      exercises: undefined, // Remove the nested object
    }));

    return NextResponse.json(transformedSets);
  } catch (error) {
    console.error('Error in GET /api/sets/all:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}
