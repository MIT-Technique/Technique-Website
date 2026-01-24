import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// Helper to check if user is an active photographer
async function isActivePhotographer(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  const { data } = await supabase
    .from("photographer_permissions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  return !!data;
}

// GET - List photographer's own posted times
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is a photographer
    const isPhotographer = await isActivePhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You are not a photographer" },
        { status: 403 }
      );
    }

    // Get photographer's posted times
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
        living_group:living_groups(id, name)
      `
      )
      .eq("created_by", user.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Get photographer times error:", error);
      return NextResponse.json(
        { error: "Failed to get times" },
        { status: 500 }
      );
    }

    return NextResponse.json({ times: times || [] });
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
    const isPhotographer = await isActivePhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You are not a photographer" },
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
    const isPhotographer = await isActivePhotographer(user.id, supabase);
    if (!isPhotographer) {
      return NextResponse.json(
        { error: "You are not a photographer" },
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
      .select("id, created_by, living_group_id")
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete time slot error:", error);
    return NextResponse.json(
      { error: "Failed to delete time slot" },
      { status: 500 }
    );
  }
}
