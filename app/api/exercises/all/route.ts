import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';

// GET /api/exercises/all - Returns all exercises (base + all user-created) for autocomplete
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Get all exercises (both base and user-created) for autocomplete suggestions
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching all exercises:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    return NextResponse.json(exercises || []);
  } catch (error) {
    console.error('Error in GET /api/exercises/all:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}
