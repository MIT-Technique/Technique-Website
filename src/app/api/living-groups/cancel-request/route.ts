import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

// POST - Request cancellation of a booked photoshoot time
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
        { error: "Only living group accounts can request cancellation" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason, timeId } = body;

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

    // Get the booking to cancel
    let query = supabase
      .from('photoshoot_times')
      .select('id, date, start_time, end_time, cancellation_requested')
      .eq('living_group_id', livingGroup.id)
      .is('cancelled_at', null);

    // If timeId is provided, get that specific booking; otherwise get any booking (backward compat)
    if (timeId) {
      query = query.eq('id', timeId);
    }

    const { data: currentBooking } = await query.single();

    if (!currentBooking) {
      return NextResponse.json(
        { error: "No active booking found to cancel" },
        { status: 404 }
      );
    }

    if (currentBooking.cancellation_requested) {
      return NextResponse.json(
        { error: "Cancellation has already been requested for this booking" },
        { status: 409 }
      );
    }

    // Mark the booking as cancellation requested
    const { data: updatedBooking, error: updateError } = await supabase
      .from('photoshoot_times')
      .update({
        cancellation_requested: true,
        cancellation_request_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentBooking.id)
      .select()
      .single();

    if (updateError) {
      console.error("Cancel request error:", updateError);
      return NextResponse.json(
        { error: "Failed to request cancellation" },
        { status: 500 }
      );
    }

    // Log the cancellation request
    await createLog(user.id, "cancellation_requested", "photoshoot_time", currentBooking.id, {
      living_group_name: livingGroup.name,
      date: currentBooking.date,
      start_time: currentBooking.start_time,
      end_time: currentBooking.end_time,
      reason: reason || null,
    });

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted. An admin will review your request.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    return NextResponse.json(
      { error: "Failed to request cancellation" },
      { status: 500 }
    );
  }
}
