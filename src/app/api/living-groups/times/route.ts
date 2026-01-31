import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get available photoshoot times for living group leaders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group' && user.role !== 'admin') {
      return NextResponse.json(
        { error: "Only living group accounts can view times" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get user's living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    // Get available (unbooked) times with creator info
    const { data: availableTimes, error } = await supabase
      .from('photoshoot_times')
      .select(`
        id,
        date,
        start_time,
        end_time,
        notes,
        created_by,
        creator:users!photoshoot_times_created_by_fkey(id, email, name, role)
      `)
      .is('living_group_id', null)
      .is('cancelled_at', null)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Get times error:", error);
      return NextResponse.json(
        { error: "Failed to get available times" },
        { status: 500 }
      );
    }

    // Get user's booked times (can have multiple)
    let bookedTimes: any[] = [];
    if (livingGroup) {
      const { data: booked } = await supabase
        .from('photoshoot_times')
        .select(`
          *,
          creator:users!photoshoot_times_created_by_fkey(id, email, name, role)
        `)
        .eq('living_group_id', livingGroup.id)
        .is('cancelled_at', null)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      bookedTimes = booked || [];
    }

    return NextResponse.json({
      availableTimes,
      bookedTimes,
      // Keep bookedTime for backward compatibility (first booked time or null)
      bookedTime: bookedTimes.length > 0 ? bookedTimes[0] : null,
      livingGroup,
      isDisabled: livingGroup?.status === 'disabled',
    });
  } catch (error) {
    console.error("Get times error:", error);
    return NextResponse.json(
      { error: "Failed to get times" },
      { status: 500 }
    );
  }
}
