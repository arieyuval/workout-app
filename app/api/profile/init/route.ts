import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Initialize user profile from signup metadata
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // Profile already exists, nothing to do
      return NextResponse.json({ message: 'Profile already exists' });
    }

    // Get weight data from user metadata
    const initialWeight = user.user_metadata?.initial_weight;
    const goalWeight = user.user_metadata?.goal_weight;

    if (!initialWeight && !goalWeight) {
      // No weight data to save
      return NextResponse.json({ message: 'No initial weight data' });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        current_weight: initialWeight || null,
        goal_weight: goalWeight || null,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    // Log the initial weight if provided
    if (initialWeight) {
      const { error: logError } = await supabase
        .from('body_weight_logs')
        .insert({
          user_id: user.id,
          weight: initialWeight,
          date: new Date().toISOString(),
          notes: 'Initial weigh-in',
        });

      if (logError) {
        console.error('Error creating initial weight log:', logError);
        // Don't fail - profile was created successfully
      }
    }

    // Clear the metadata after saving (optional - keeps metadata clean)
    await supabase.auth.updateUser({
      data: {
        initial_weight: null,
        goal_weight: null,
      },
    });

    return NextResponse.json({ message: 'Profile initialized successfully' });
  } catch (error) {
    console.error('Error in POST /api/profile/init:', error);
    return NextResponse.json(
      { error: 'Failed to initialize profile' },
      { status: 500 }
    );
  }
}
