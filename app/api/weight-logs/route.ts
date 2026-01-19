import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: logs, error } = await supabase
      .from('body_weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching weight logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch weight logs' },
        { status: 500 }
      );
    }

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error('Error in GET /api/weight-logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight logs' },
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

    const body = await request.json();
    const { weight, date, notes } = body;

    if (!weight || weight <= 0) {
      return NextResponse.json(
        { error: 'Valid weight is required' },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabase
      .from('body_weight_logs')
      .insert({
        user_id: user.id,
        weight,
        date: date || new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating weight log:', error);
      return NextResponse.json(
        { error: 'Failed to log weight' },
        { status: 500 }
      );
    }

    // Also update current_weight in profile
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('user_profiles')
        .update({
          current_weight: weight,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          current_weight: weight,
        });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/weight-logs:', error);
    return NextResponse.json(
      { error: 'Failed to log weight' },
      { status: 500 }
    );
  }
}
