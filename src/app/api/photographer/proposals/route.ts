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

// GET - View all pending proposals from living groups
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

    // Get all pending proposals
    const { data: proposals, error } = await supabase
      .from("time_proposals")
      .select(
        `
        id,
        date,
        start_time,
        end_time,
        location,
        notes,
        status,
        created_at,
        living_group:living_groups(id, name),
        proposer:users!time_proposals_proposed_by_fkey(id, email, first_name, last_name)
      `
      )
      .eq("status", "pending")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Get proposals error:", error);
      return NextResponse.json(
        { error: "Failed to get proposals" },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposals: proposals || [] });
  } catch (error) {
    console.error("Get proposals error:", error);
    return NextResponse.json(
      { error: "Failed to get proposals" },
      { status: 500 }
    );
  }
}

// PUT - Accept or decline a proposal
export async function PUT(request: NextRequest) {
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
    const { proposalId, action, decline_reason } = body;

    if (!proposalId || !action) {
      return NextResponse.json(
        { error: "Proposal ID and action are required" },
        { status: 400 }
      );
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Get the proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("time_proposals")
      .select("id, living_group_id, status, date, start_time, end_time, location, notes")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "This proposal has already been processed" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Update proposal status
      const { error: updateError } = await supabase
        .from("time_proposals")
        .update({
          status: "accepted",
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (updateError) {
        console.error("Update proposal error:", updateError);
        return NextResponse.json(
          { error: "Failed to accept proposal" },
          { status: 500 }
        );
      }

      // Create a photoshoot_time entry
      const { error: timeError } = await supabase
        .from("photoshoot_times")
        .insert({
          date: proposal.date,
          start_time: proposal.start_time,
          end_time: proposal.end_time,
          location: proposal.location,
          notes: proposal.notes,
          living_group_id: proposal.living_group_id,
          booked_at: new Date().toISOString(),
          booked_by: user.id,
          created_by: user.id,
        });

      if (timeError) {
        console.error("Create photoshoot time error:", timeError);
        // Rollback proposal update
        await supabase
          .from("time_proposals")
          .update({
            status: "pending",
            accepted_by: null,
            accepted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", proposalId);

        return NextResponse.json(
          { error: "Failed to create photoshoot time" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, status: "accepted" });
    } else {
      // Decline the proposal
      const { error: updateError } = await supabase
        .from("time_proposals")
        .update({
          status: "declined",
          declined_by: user.id,
          declined_at: new Date().toISOString(),
          decline_reason: decline_reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (updateError) {
        console.error("Update proposal error:", updateError);
        return NextResponse.json(
          { error: "Failed to decline proposal" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, status: "declined" });
    }
  } catch (error) {
    console.error("Process proposal error:", error);
    return NextResponse.json(
      { error: "Failed to process proposal" },
      { status: 500 }
    );
  }
}
