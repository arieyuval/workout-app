import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { workout_ids } = body;

    if (!Array.isArray(workout_ids) || workout_ids.length === 0) {
      return NextResponse.json(
        { error: 'workout_ids array is required' },
        { status: 400 }
      );
    }

    // Verify all workouts belong to user
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .in('id', workout_ids);

    if (!existing || existing.length !== workout_ids.length) {
      return NextResponse.json(
        { error: 'One or more workouts not found' },
        { status: 404 }
      );
    }

    // Update display_order for each workout based on array index
    for (let i = 0; i < workout_ids.length; i++) {
      const { error } = await supabase
        .from('workouts')
        .update({ display_order: i })
        .eq('id', workout_ids[i])
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating workout order:', error);
        return NextResponse.json(
          { error: 'Failed to reorder workouts' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/workouts/reorder:', error);
    return NextResponse.json(
      { error: 'Failed to reorder workouts' },
      { status: 500 }
    );
  }
}
