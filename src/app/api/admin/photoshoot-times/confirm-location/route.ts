import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createLog } from "../../../../../lib/admin-logs";

// PUT - Confirm a location for a pending booking
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'staph') {
      return NextResponse.json(
        { error: "Only admin or staph can confirm locations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { timeId, location } = body;

    if (!timeId || !location || typeof location !== 'string' || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Time slot ID and location are required" },
        { status: 400 }
      );
    }

    const trimmedLocation = location.trim();
    if (trimmedLocation.length > 200) {
      return NextResponse.json(
        { error: "Location must be 200 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the time slot to verify it's pending
    const { data: timeSlot, error: fetchError } = await supabase
      .from('photoshoot_times')
      .select('id, booking_status, proposed_locations, living_group_id')
      .eq('id', timeId)
      .single();

    if (fetchError || !timeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (timeSlot.booking_status !== 'pending_location') {
      return NextResponse.json(
        { error: "This booking is not pending location confirmation" },
        { status: 400 }
      );
    }

    // Verify the selected location is one of the proposed ones
    if (!timeSlot.proposed_locations?.includes(trimmedLocation)) {
      return NextResponse.json(
        { error: "Selected location must be one of the proposed locations" },
        { status: 400 }
      );
    }

    // Update the time slot
    const { data: updated, error: updateError } = await supabase
      .from('photoshoot_times')
      .update({
        location: trimmedLocation,
        booking_status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to confirm location" },
        { status: 500 }
      );
    }

    await createLog(user.id, "location_confirmed", "photoshoot_time", timeId, {
      location: trimmedLocation,
      living_group_id: timeSlot.living_group_id,
    });

    return NextResponse.json({ success: true, time: updated });
  } catch (error) {
    console.error("Confirm location error:", error);
    return NextResponse.json(
      { error: "Failed to confirm location" },
      { status: 500 }
    );
  }
}
