import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

// POST - Book a photoshoot time
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can book times" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { timeId, proposed_locations } = body;

    if (!timeId) {
      return NextResponse.json(
        { error: "Time slot ID is required" },
        { status: 400 }
      );
    }

    // Validate proposed_locations (required, array of 1-5 strings, each max 200 chars)
    if (!Array.isArray(proposed_locations) || proposed_locations.length === 0) {
      return NextResponse.json(
        { error: "At least one proposed location is required" },
        { status: 400 }
      );
    }
    if (proposed_locations.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 proposed locations allowed" },
        { status: 400 }
      );
    }
    const cleanedLocations = proposed_locations
      .map((l: unknown) => (typeof l === 'string' ? l.trim() : ''))
      .filter((l: string) => l.length > 0);
    if (cleanedLocations.length === 0) {
      return NextResponse.json(
        { error: "At least one non-empty proposed location is required" },
        { status: 400 }
      );
    }
    if (cleanedLocations.some((l: string) => l.length > 200)) {
      return NextResponse.json(
        { error: "Each location must be 200 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's living group
    const { data: livingGroup } = await supabase
      .from('living_groups')
      .select('id, status, name')
      .eq('user_id', user.id)
      .single();

    if (!livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if living group is disabled
    if (livingGroup.status === 'disabled') {
      return NextResponse.json(
        { error: "Your living group account is disabled. Contact admin for assistance." },
        { status: 403 }
      );
    }

    // Check if the time slot is still available (atomic check with update)
    const { data: bookedTime, error: bookError } = await supabase
      .from('photoshoot_times')
      .update({
        living_group_id: livingGroup.id,
        booked_at: new Date().toISOString(),
        booked_by: user.id,
        proposed_locations: cleanedLocations,
        booking_status: 'pending_location',
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeId)
      .is('living_group_id', null) // Only book if still available
      .is('cancelled_at', null)
      .select()
      .single();

    if (bookError || !bookedTime) {
      // Time slot was already taken
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }

    // Log the booking
    await createLog(user.id, "time_booked", "photoshoot_time", timeId, {
      living_group_name: livingGroup.name,
      date: bookedTime.date,
      start_time: bookedTime.start_time,
      end_time: bookedTime.end_time,
    });

    return NextResponse.json({
      success: true,
      bookedTime,
    });
  } catch (error) {
    console.error("Book time error:", error);
    return NextResponse.json(
      { error: "Failed to book time" },
      { status: 500 }
    );
  }
}
