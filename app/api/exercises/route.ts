import { NextRequest, NextResponse } from 'next/server';
import { getExercises } from '@/lib/data-utils';
import { supabase } from '@/lib/supabase';
import type { ExerciseInsert } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const muscleGroup = searchParams.get('muscle_group');

    const exercises = await getExercises(muscleGroup || undefined);

    return NextResponse.json(exercises);
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
    const body: ExerciseInsert = await request.json();
    console.log('Creating exercise with data:', body);

    const { data, error } = await supabase
      .from('exercises')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create exercise', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise', details: String(error) },
      { status: 500 }
    );
  }
}
