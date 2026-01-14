import { NextRequest, NextResponse } from 'next/server';
import { logSet, getSetHistory } from '@/lib/data-utils';
import type { WorkoutSetInsert } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exerciseId = searchParams.get('exercise_id');

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exercise_id parameter is required' },
        { status: 400 }
      );
    }

    const sets = await getSetHistory(exerciseId);

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
    const body: WorkoutSetInsert = await request.json();

    // Validate required fields
    if (!body.exercise_id || body.weight === undefined || body.reps === undefined) {
      return NextResponse.json(
        { error: 'exercise_id, weight, and reps are required' },
        { status: 400 }
      );
    }

    // Set date to now if not provided
    const setData: WorkoutSetInsert = {
      ...body,
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
    return NextResponse.json(
      { error: 'Failed to log set' },
      { status: 500 }
    );
  }
}
