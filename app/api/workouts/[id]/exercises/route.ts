import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { exercise_ids } = body;

    if (!Array.isArray(exercise_ids)) {
      return NextResponse.json(
        { error: 'exercise_ids must be an array' },
        { status: 400 }
      );
    }

    // Verify workout ownership
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Delete existing exercise links for this workout
    const { error: deleteError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', id);

    if (deleteError) {
      console.error('Error clearing workout exercises:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update workout exercises' },
        { status: 500 }
      );
    }

    // Insert new exercise links
    if (exercise_ids.length > 0) {
      const rows = exercise_ids.map((exerciseId: string, index: number) => ({
        workout_id: id,
        exercise_id: exerciseId,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(rows);

      if (insertError) {
        console.error('Error inserting workout exercises:', insertError);
        return NextResponse.json(
          { error: 'Failed to update workout exercises' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, exercise_ids });
  } catch (error) {
    console.error('Error in PUT /api/workouts/[id]/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to update workout exercises' },
      { status: 500 }
    );
  }
}
