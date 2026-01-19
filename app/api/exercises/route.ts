import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';
import type { Exercise, ExerciseInsert } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const muscleGroup = searchParams.get('muscle_group');

    // Get base exercises (shown to all users)
    let baseQuery = supabase
      .from('exercises')
      .select('*')
      .eq('is_base', true)
      .order('name');

    if (muscleGroup && muscleGroup !== 'All') {
      baseQuery = baseQuery.eq('muscle_group', muscleGroup);
    }

    const { data: baseExercises, error: baseError } = await baseQuery;

    if (baseError) {
      console.error('Error fetching base exercises:', baseError);
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    // Get user's added exercises (non-base exercises linked to this user)
    let userQuery = supabase
      .from('user_exercises')
      .select('exercise_id, exercises(*)')
      .eq('user_id', user.id);

    const { data: userExerciseLinks, error: userError } = await userQuery;

    if (userError) {
      console.error('Error fetching user exercises:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    // Extract user exercises and filter by muscle group if needed
    let userExercises: Exercise[] = (userExerciseLinks || [])
      .map((link) => link.exercises as unknown as Exercise | null)
      .filter((ex): ex is Exercise => ex !== null);

    if (muscleGroup && muscleGroup !== 'All') {
      userExercises = userExercises.filter((ex) => ex.muscle_group === muscleGroup);
    }

    // Combine base and user exercises, removing duplicates (user exercises override base)
    const baseIds = new Set((baseExercises || []).map((ex) => ex.id));
    const uniqueUserExercises = userExercises.filter((ex) => !baseIds.has(ex.id));

    const allExercises = [...(baseExercises || []), ...uniqueUserExercises]
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(allExercises);
  } catch (error) {
    console.error('Error in GET /api/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
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
    const body: ExerciseInsert = await request.json();
    console.log('Adding exercise for user:', user.id, 'with data:', body);

    // Check if an exercise with the same name and muscle group already exists
    const { data: existingExercise, error: searchError } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', body.name.trim())
      .eq('muscle_group', body.muscle_group)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Error searching for existing exercise:', searchError);
    }

    let exerciseToAdd;

    if (existingExercise) {
      // Exercise already exists, use it
      console.log('Found existing exercise:', existingExercise.id);
      exerciseToAdd = existingExercise;
    } else {
      // Create new exercise (as non-base, individual exercise)
      const { data: newExercise, error: createError } = await supabase
        .from('exercises')
        .insert({
          ...body,
          is_base: false,
          uses_body_weight: body.uses_body_weight ?? false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Supabase error creating exercise:', createError);
        return NextResponse.json(
          { error: 'Failed to create exercise', details: createError.message },
          { status: 500 }
        );
      }

      console.log('Created new exercise:', newExercise.id);
      exerciseToAdd = newExercise;
    }

    // Add exercise to user's feed (if not already there)
    const { error: linkError } = await supabase
      .from('user_exercises')
      .upsert(
        {
          user_id: user.id,
          exercise_id: exerciseToAdd.id,
        },
        { onConflict: 'user_id,exercise_id' }
      );

    if (linkError) {
      console.error('Error linking exercise to user:', linkError);
      return NextResponse.json(
        { error: 'Failed to add exercise to your feed', details: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(exerciseToAdd, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise', details: String(error) },
      { status: 500 }
    );
  }
}
