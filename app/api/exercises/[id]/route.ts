import { NextRequest, NextResponse } from 'next/server';
import { getExercise, updateExerciseDefaultPrReps } from '@/lib/data-utils';

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

    if (body.default_pr_reps !== undefined) {
      const updated = await updateExerciseDefaultPrReps(id, body.default_pr_reps);

      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update exercise' },
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
