import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";
import { isValidTimeSlot } from "../../../../lib/utils/time";

// Helper to check if user is staph or has active photographer permissions
async function isStaphOrPhotographer(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  // Check if user is staph or has photographer role
  const { data: userData } = await supabase
    .from("users")
    .select("is_staph, role")
    .eq("id", userId)
    .single();

  if (userData?.is_staph || userData?.role === "photographer") {
    return true;
  }

  // Check photographer_permissions as fallback
  const { data: permData } = await supabase
    .from("photographer_permissions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  return !!permData;
}

// GET - List ALL posted times with creator info (for staph dashboard)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is staph
    const isPhotographer = await isStaphOrPhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You don't have staph access" },
        { status: 403 }
      );
    }

    // Get ALL posted times with creator info
    const { data: times, error } = await supabase
      .from("photoshoot_times")
      .select(
        `
        id,
        date,
        start_time,
        end_time,
        location,
        notes,
        living_group_id,
        booked_at,
        booked_by,
        created_at,
        created_by,
        living_group:living_groups(id, name),
        creator:users!photoshoot_times_created_by_fkey(id, email, name, role)
      `
      )
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Get photographer times error:", error);
      return NextResponse.json(
        { error: "Failed to get times" },
        { status: 500 }
      );
    }

    // Return times with current user id so frontend can determine ownership
    return NextResponse.json({ times: times || [], currentUserId: user.id });
  } catch (error) {
    console.error("Get photographer times error:", error);
    return NextResponse.json(
      { error: "Failed to get times" },
      { status: 500 }
    );
  }
}

// POST - Create new time slot
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is a photographer
    const isPhotographer = await isStaphOrPhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You don't have staph access" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, start_time, end_time, location, notes } = body;

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Date, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate 15-minute time boundaries
    if (!isValidTimeSlot(start_time) || !isValidTimeSlot(end_time)) {
      return NextResponse.json(
        { error: "Times must be on 15-minute boundaries (XX:00, XX:15, XX:30, or XX:45)" },
        { status: 400 }
      );
    }

    // Create the time slot
    const { data, error } = await supabase
      .from("photoshoot_times")
      .insert({
        date,
        start_time,
        end_time,
        location: location || null,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Create time slot error:", error);
      return NextResponse.json(
        { error: "Failed to create time slot" },
        { status: 500 }
      );
    }

    // Log the time creation
    await createLog(user.id, "time_created", "photoshoot_time", data.id, {
      date,
      start_time,
      end_time,
      location,
    });

    return NextResponse.json({ success: true, time: data });
  } catch (error) {
    console.error("Create time slot error:", error);
    return NextResponse.json(
      { error: "Failed to create time slot" },
      { status: 500 }
    );
  }
}

// DELETE - Delete own unbooked time slot
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is a photographer
    const isPhotographer = await isStaphOrPhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You don't have staph access" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeId = searchParams.get("id");

    if (!timeId) {
      return NextResponse.json(
        { error: "Time ID is required" },
        { status: 400 }
      );
    }

    // Check if time slot exists and belongs to user
    const { data: timeSlot, error: fetchError } = await supabase
      .from("photoshoot_times")
      .select("id, created_by, living_group_id, date, start_time, end_time")
      .eq("id", timeId)
      .single();

    if (fetchError || !timeSlot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (timeSlot.created_by !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own time slots" },
        { status: 403 }
      );
    }

    if (timeSlot.living_group_id) {
      return NextResponse.json(
        { error: "Cannot delete a booked time slot" },
        { status: 400 }
      );
    }

    // Delete the time slot
    const { error: deleteError } = await supabase
      .from("photoshoot_times")
      .delete()
      .eq("id", timeId);

    if (deleteError) {
      console.error("Delete time slot error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete time slot" },
        { status: 500 }
      );
    }

    // Log the time deletion
    await createLog(user.id, "time_deleted", "photoshoot_time", timeId, {
      date: timeSlot.date,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete time slot error:", error);
    return NextResponse.json(
      { error: "Failed to delete time slot" },
      { status: 500 }
    );
  }
}
