import { NextRequest, NextResponse } from 'next/server';
import { getExercise, updateExerciseDefaultPrReps, updateExercisePinnedNote, updateExerciseGoalWeight, updateExerciseGoalReps } from '@/lib/data-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exercise = await getExercise(id);

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error in GET /api/exercises/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.user_pr_reps !== undefined) {
      const updated = await updateExerciseDefaultPrReps(id, body.user_pr_reps);

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update exercise' },
          { status: 500 }
        );
      }

      return NextResponse.json(updated);
    }

    if (body.pinned_note !== undefined) {
      // Allow null or empty string to clear the note
      const noteValue = body.pinned_note === '' ? null : body.pinned_note;
      const updated = await updateExercisePinnedNote(id, noteValue);

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update pinned note' },
          { status: 500 }
        );
      }

      return NextResponse.json(updated);
    }

    if (body.goal_weight !== undefined) {
      // Allow null to clear the goal weight
      const goalValue = body.goal_weight === null || body.goal_weight === '' ? null : parseFloat(body.goal_weight);
      const updated = await updateExerciseGoalWeight(id, goalValue);

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update goal weight' },
          { status: 500 }
        );
      }

      return NextResponse.json(updated);
    }

    if (body.goal_reps !== undefined) {
      // Allow null to clear the goal reps
      const goalValue = body.goal_reps === null || body.goal_reps === '' ? null : parseInt(body.goal_reps);
      const updated = await updateExerciseGoalReps(id, goalValue);

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update goal reps' },
          { status: 500 }
        );
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/exercises/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}
