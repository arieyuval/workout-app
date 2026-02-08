import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch user's workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
      return NextResponse.json(
        { error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    if (!workouts || workouts.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all workout_exercises for this user's workouts
    const workoutIds = workouts.map((w) => w.id);
    const { data: workoutExercises, error: weError } = await supabase
      .from('workout_exercises')
      .select('workout_id, exercise_id')
      .in('workout_id', workoutIds)
      .order('display_order');

    if (weError) {
      console.error('Error fetching workout exercises:', weError);
      return NextResponse.json(
        { error: 'Failed to fetch workout exercises' },
        { status: 500 }
      );
    }

    // Group exercise_ids by workout_id
    const exercisesByWorkout = new Map<string, string[]>();
    (workoutExercises || []).forEach((we) => {
      const existing = exercisesByWorkout.get(we.workout_id) || [];
      existing.push(we.exercise_id);
      exercisesByWorkout.set(we.workout_id, existing);
    });

    // Combine workouts with their exercise_ids
    const result = workouts.map((w) => ({
      ...w,
      exercise_ids: exercisesByWorkout.get(w.id) || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Workout name is required' },
        { status: 400 }
      );
    }

    // Get max display_order for this user
    const { data: maxOrderRow } = await supabase
      .from('workouts')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderRow?.display_order ?? -1) + 1;

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...workout, exercise_ids: [] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workouts:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}
