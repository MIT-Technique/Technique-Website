import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../../../../lib/auth/session";

interface LeaveRequest {
  membershipId: string;
}

// POST /api/living-groups/leave
// Leave a living group or cancel a pending request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: LeaveRequest = await request.json();
    const { membershipId } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    // Get the membership and verify ownership
    const { data: membership, error: fetchError } = await supabase
      .from("living_group_memberships")
      .select("id, user_id, status, membership_type")
      .eq("id", membershipId)
      .single();

    if (fetchError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this membership
    if (membership.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "You can only leave your own memberships" },
        { status: 403 }
      );
    }

    // Only allow leaving active or pending memberships
    if (membership.status === "removed") {
      return NextResponse.json(
        { error: "This membership has already been removed" },
        { status: 400 }
      );
    }

    // Update status to 'removed' (soft delete)
    const { error: updateError } = await supabase
      .from("living_group_memberships")
      .update({ status: "removed" })
      .eq("id", membershipId);

    if (updateError) {
      console.error("Leave living group error:", updateError);
      return NextResponse.json(
        { error: "Failed to leave living group" },
        { status: 500 }
      );
    }

    const message = membership.status === "pending"
      ? "Join request cancelled"
      : "Successfully left the living group";

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Leave living group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
