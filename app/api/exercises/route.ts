import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';
import type { Exercise, ExerciseInsert, ExerciseWithUserData, UserExercise, MuscleGroup } from '@/lib/types';
import { exerciseMatchesMuscleTab } from '@/lib/muscle-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const muscleGroup = searchParams.get('muscle_group');

    // Fetch base exercises (available to all users)
    const { data: baseExercises, error: baseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_base', true)
      .order('name');

    if (baseError) {
      console.error('Error fetching base exercises:', baseError);
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    // Fetch user-specific data and user-created exercises
    const { data: userExerciseLinks, error: userError } = await supabase
      .from('user_exercises')
      .select(`
        exercise_id,
        user_pr_reps,
        pinned_note,
        goal_weight,
        goal_reps,
        exercises (*)
      `)
      .eq('user_id', user.id);

    if (userError) {
      console.error('Error fetching user exercises:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    // Create a map of user-specific settings by exercise_id
    const userDataMap = new Map<string, {
      user_pr_reps?: number;
      pinned_note?: string;
      goal_weight?: number;
      goal_reps?: number;
    }>();

    // Collect user-created exercises and build user data map
    const userCreatedExercises: Exercise[] = [];

    (userExerciseLinks || []).forEach((link) => {
      // Store user-specific settings
      userDataMap.set(link.exercise_id, {
        user_pr_reps: link.user_pr_reps,
        pinned_note: link.pinned_note,
        goal_weight: link.goal_weight,
        goal_reps: link.goal_reps,
      });

      // Collect user-created exercises
      const exercise = link.exercises as unknown as Exercise | null;
      if (exercise && !exercise.is_base) {
        userCreatedExercises.push(exercise);
      }
    });

    // Merge base exercises with user data
    const baseWithUserData: ExerciseWithUserData[] = (baseExercises || []).map((ex) => {
      const userData = userDataMap.get(ex.id) || {};
      return {
        ...ex,
        user_pr_reps: userData.user_pr_reps || 3, // Default to 3 for base exercises
        pinned_note: userData.pinned_note,
        goal_weight: userData.goal_weight,
        goal_reps: userData.goal_reps,
      };
    });

    // Merge user-created exercises with user data
    const userCreatedWithData: ExerciseWithUserData[] = userCreatedExercises.map((ex) => {
      const userData = userDataMap.get(ex.id) || {};
      return {
        ...ex,
        user_pr_reps: userData.user_pr_reps || 3,
        pinned_note: userData.pinned_note,
        goal_weight: userData.goal_weight,
        goal_reps: userData.goal_reps,
      };
    });

    // Combine and sort
    let allExercises = [...baseWithUserData, ...userCreatedWithData]
      .sort((a, b) => a.name.localeCompare(b.name));

    // Filter by muscle group client-side to handle both string and array formats
    if (muscleGroup && muscleGroup !== 'All') {
      allExercises = allExercises.filter((ex) =>
        exerciseMatchesMuscleTab(ex, muscleGroup as MuscleGroup)
      );
    }

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
    const body = await request.json();
    console.log('Adding exercise for user:', user.id, 'with data:', body);

    // Extract user-specific fields
    const user_pr_reps = body.user_pr_reps;

    // Exercise data (without user-specific fields)
    const exerciseData: ExerciseInsert = {
      name: body.name,
      muscle_group: body.muscle_group,
      exercise_type: body.exercise_type,
      is_base: false,
      uses_body_weight: body.uses_body_weight ?? false,
    };

    // Check if an exercise with the same name and muscle group already exists
    // First get all exercises with the same name (case-insensitive)
    const { data: exercisesWithSameName, error: searchError } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', exerciseData.name.trim());

    if (searchError) {
      console.error('Error searching for existing exercise:', searchError);
    }

    // Find exact match by comparing muscle_group (handles both string and array)
    const existingExercise = exercisesWithSameName?.find((ex) => {
      const exMuscleGroup = ex.muscle_group;
      const bodyMuscleGroup = exerciseData.muscle_group;

      // Both are arrays - compare as sorted arrays
      if (Array.isArray(exMuscleGroup) && Array.isArray(bodyMuscleGroup)) {
        const sorted1 = [...exMuscleGroup].sort();
        const sorted2 = [...bodyMuscleGroup].sort();
        return sorted1.length === sorted2.length &&
               sorted1.every((val, idx) => val === sorted2[idx]);
      }

      // Both are strings - simple equality
      if (typeof exMuscleGroup === 'string' && typeof bodyMuscleGroup === 'string') {
        return exMuscleGroup === bodyMuscleGroup;
      }

      // One is array, one is string - not a match
      return false;
    });

    let exerciseToAdd;

    if (existingExercise) {
      // Exercise already exists, use it
      console.log('Found existing exercise:', existingExercise.id);
      exerciseToAdd = existingExercise;
    } else {
      // Create new exercise (as non-base, individual exercise)
      const { data: newExercise, error: createError } = await supabase
        .from('exercises')
        .insert(exerciseData)
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

    // Add exercise to user's feed with user-specific settings
    const { data: userExercise, error: linkError } = await supabase
      .from('user_exercises')
      .upsert(
        {
          user_id: user.id,
          exercise_id: exerciseToAdd.id,
          user_pr_reps: user_pr_reps || 3, // Default to 3 if not provided
        },
        { onConflict: 'user_id,exercise_id' }
      )
      .select()
      .single();

    if (linkError) {
      console.error('Error linking exercise to user:', linkError);
      return NextResponse.json(
        { error: 'Failed to add exercise to your feed', details: linkError.message },
        { status: 500 }
      );
    }

    // Combine exercise data with user-specific settings
    const exerciseWithUserData: ExerciseWithUserData = {
      ...exerciseToAdd,
      user_pr_reps: userExercise?.user_pr_reps,
      pinned_note: userExercise?.pinned_note,
      goal_weight: userExercise?.goal_weight,
      goal_reps: userExercise?.goal_reps,
    };

    return NextResponse.json(exerciseWithUserData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise', details: String(error) },
      { status: 500 }
    );
  }
}
