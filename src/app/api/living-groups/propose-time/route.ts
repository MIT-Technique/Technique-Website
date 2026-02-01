import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isValidTimeSlot } from "../../../../lib/utils/time";

// GET - Get living group's time proposals
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can view proposals" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, status")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Get proposals for this living group
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
        accepted_by,
        accepted_at,
        declined_by,
        declined_at,
        decline_reason,
        living_group:living_groups(id, name),
        accepter:users!time_proposals_accepted_by_fkey(id, email, name)
      `
      )
      .eq("living_group_id", livingGroup.id)
      .order("created_at", { ascending: false });

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

// POST - Create a time proposal
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can propose times" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, status")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    if (livingGroup.status !== "active") {
      return NextResponse.json(
        { error: "Your living group account is not active" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, start_time, end_time, notes } = body;

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

    // Create the proposal (pending until a photographer accepts)
    const { data, error } = await supabase
      .from("time_proposals")
      .insert({
        living_group_id: livingGroup.id,
        proposed_by: user.id,
        date,
        start_time,
        end_time,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create proposal error:", error);
      return NextResponse.json(
        { error: "Failed to create proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, proposal: data });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending proposal
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can cancel proposals" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const proposalId = searchParams.get("id");

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    // Check if proposal exists and belongs to this living group
    const { data: proposal, error: fetchError } = await supabase
      .from("time_proposals")
      .select("id, living_group_id, status")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.living_group_id !== livingGroup.id) {
      return NextResponse.json(
        { error: "You can only cancel your own proposals" },
        { status: 403 }
      );
    }

    if (proposal.status !== "pending" && proposal.status !== "accepted") {
      return NextResponse.json(
        { error: "Can only cancel pending or accepted proposals" },
        { status: 400 }
      );
    }

    // If proposal was accepted, clean up the associated photoshoot_times entry
    if (proposal.status === "accepted") {
      const { data: proposalDetails } = await supabase
        .from("time_proposals")
        .select("date, start_time, end_time, living_group_id")
        .eq("id", proposalId)
        .single();

      if (proposalDetails) {
        const { data: matchingTime } = await supabase
          .from("photoshoot_times")
          .select("id")
          .eq("living_group_id", proposalDetails.living_group_id)
          .eq("date", proposalDetails.date)
          .eq("start_time", proposalDetails.start_time)
          .eq("end_time", proposalDetails.end_time)
          .is("cancelled_at", null)
          .maybeSingle();

        if (matchingTime) {
          await supabase
            .from("living_group_time_assignments")
            .delete()
            .eq("photoshoot_time_id", matchingTime.id);

          await supabase
            .from("photoshoot_times")
            .update({
              cancelled_at: new Date().toISOString(),
              cancelled_by: user.id,
              living_group_id: null,
              booked_at: null,
              booked_by: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", matchingTime.id);
        }
      }
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from("time_proposals")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error("Cancel proposal error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel proposal error:", error);
    return NextResponse.json(
      { error: "Failed to cancel proposal" },
      { status: 500 }
    );
  }
}
