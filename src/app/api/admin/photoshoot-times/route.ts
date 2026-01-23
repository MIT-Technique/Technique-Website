import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List all photoshoot times
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const bookedOnly = searchParams.get('booked') === 'true';
    const availableOnly = searchParams.get('available') === 'true';
    const cancellationRequested = searchParams.get('cancellation_requested') === 'true';

    let query = supabase
      .from('photoshoot_times')
      .select(`
        *,
        living_group:living_groups(id, name, user_id)
      `)
      .is('cancelled_at', null)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    if (bookedOnly) {
      query = query.not('living_group_id', 'is', null);
    }

    if (availableOnly) {
      query = query.is('living_group_id', null);
    }

    if (cancellationRequested) {
      query = query.eq('cancellation_requested', true);
    }

    const { data: times, error } = await query;

    if (error) {
      console.error("Error fetching photoshoot times:", error);
      return NextResponse.json(
        { error: "Failed to fetch photoshoot times" },
        { status: 500 }
      );
    }

    return NextResponse.json({ times });
  } catch (error) {
    console.error("Error fetching photoshoot times:", error);
    return NextResponse.json(
      { error: "Failed to fetch photoshoot times" },
      { status: 500 }
    );
  }
}

// POST - Create a new photoshoot time
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, startTime, endTime, notes } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Date, start time, and end time are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check for overlapping times on the same date
    const { data: existingTimes } = await supabase
      .from('photoshoot_times')
      .select('id, start_time, end_time')
      .eq('date', date)
      .is('cancelled_at', null);

    if (existingTimes) {
      const hasOverlap = existingTimes.some(time => {
        return (startTime < time.end_time && endTime > time.start_time);
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: "This time slot overlaps with an existing slot" },
          { status: 409 }
        );
      }
    }

    const { data: newTime, error } = await supabase
      .from('photoshoot_times')
      .insert({
        date,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating photoshoot time:", error);
      return NextResponse.json(
        { error: "Failed to create photoshoot time" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      time: newTime,
    });
  } catch (error) {
    console.error("Error creating photoshoot time:", error);
    return NextResponse.json(
      { error: "Failed to create photoshoot time" },
      { status: 500 }
    );
  }
}

// PUT - Update a photoshoot time (or approve/deny cancellation)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeId, action, date, startTime, endTime, notes } = body;

    if (!timeId) {
      return NextResponse.json(
        { error: "Time slot ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle cancellation approval/denial
    if (action === 'approve_cancellation') {
      const { data: updatedTime, error } = await supabase
        .from('photoshoot_times')
        .update({
          cancellation_approved: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          living_group_id: null,
          booked_at: null,
          booked_by: null,
          cancellation_requested: false,
          cancellation_request_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timeId)
        .select()
        .single();

      if (error) {
        console.error("Error approving cancellation:", error);
        return NextResponse.json(
          { error: "Failed to approve cancellation" },
          { status: 500 }
        );
      }

      return NextResponse.json({ time: updatedTime });
    }

    if (action === 'deny_cancellation') {
      const { data: updatedTime, error } = await supabase
        .from('photoshoot_times')
        .update({
          cancellation_approved: false,
          cancellation_requested: false,
          cancellation_request_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timeId)
        .select()
        .single();

      if (error) {
        console.error("Error denying cancellation:", error);
        return NextResponse.json(
          { error: "Failed to deny cancellation" },
          { status: 500 }
        );
      }

      return NextResponse.json({ time: updatedTime });
    }

    // Regular update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (date) updateData.date = date;
    if (startTime) updateData.start_time = startTime;
    if (endTime) updateData.end_time = endTime;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updatedTime, error } = await supabase
      .from('photoshoot_times')
      .update(updateData)
      .eq('id', timeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating photoshoot time:", error);
      return NextResponse.json(
        { error: "Failed to update photoshoot time" },
        { status: 500 }
      );
    }

    return NextResponse.json({ time: updatedTime });
  } catch (error) {
    console.error("Error updating photoshoot time:", error);
    return NextResponse.json(
      { error: "Failed to update photoshoot time" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a photoshoot time (soft delete by setting cancelled_at)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeId } = body;

    if (!timeId) {
      return NextResponse.json(
        { error: "Time slot ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: deletedTime, error } = await supabase
      .from('photoshoot_times')
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeId)
      .select()
      .single();

    if (error) {
      console.error("Error deleting photoshoot time:", error);
      return NextResponse.json(
        { error: "Failed to delete photoshoot time" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      time: deletedTime,
    });
  } catch (error) {
    console.error("Error deleting photoshoot time:", error);
    return NextResponse.json(
      { error: "Failed to delete photoshoot time" },
      { status: 500 }
    );
  }
}
