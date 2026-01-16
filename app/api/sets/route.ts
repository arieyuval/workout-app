import { NextRequest, NextResponse } from 'next/server';
import { logSet, getSetHistory } from '@/lib/data-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { WorkoutSetInsert } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const exerciseId = searchParams.get('exercise_id');

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exercise_id parameter is required' },
        { status: 400 }
      );
    }

    const sets = await getSetHistory(exerciseId, user.id);

    return NextResponse.json(sets);
  } catch (error) {
    console.error('Error in GET /api/sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: WorkoutSetInsert = await request.json();
    console.log('Logging set with data:', body);

    // Validate required fields - either (weight + reps) OR (distance + duration)
    if (!body.exercise_id) {
      return NextResponse.json(
        { error: 'exercise_id is required' },
        { status: 400 }
      );
    }

    const hasStrengthData = body.weight !== undefined && body.reps !== undefined;
    const hasCardioData = body.distance !== undefined && body.duration !== undefined;

    if (!hasStrengthData && !hasCardioData) {
      return NextResponse.json(
        { error: 'Either (weight and reps) or (distance and duration) are required' },
        { status: 400 }
      );
    }

    // Set date to now if not provided, and add user_id
    const setData: WorkoutSetInsert = {
      ...body,
      user_id: user.id,
      date: body.date || new Date().toISOString(),
    };

    const newSet = await logSet(setData);

    if (!newSet) {
      return NextResponse.json(
        { error: 'Failed to log set' },
        { status: 500 }
      );
    }

    return NextResponse.json(newSet, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sets:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
