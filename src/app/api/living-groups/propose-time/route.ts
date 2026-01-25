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
        accepter:users!time_proposals_accepted_by_fkey(id, email, first_name, last_name)
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
    const { date, start_time, end_time, location, notes } = body;

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Date, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate 30-minute time boundaries
    if (!isValidTimeSlot(start_time) || !isValidTimeSlot(end_time)) {
      return NextResponse.json(
        { error: "Times must be on 30-minute boundaries (XX:00 or XX:30)" },
        { status: 400 }
      );
    }

    // Create the proposal
    const { data, error } = await supabase
      .from("time_proposals")
      .insert({
        living_group_id: livingGroup.id,
        proposed_by: user.id,
        date,
        start_time,
        end_time,
        location: location || null,
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

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "Can only cancel pending proposals" },
        { status: 400 }
      );
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
