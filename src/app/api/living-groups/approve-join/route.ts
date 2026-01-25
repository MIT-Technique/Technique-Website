import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

interface ApproveJoinRequest {
  membershipId: string;
  action: "approve" | "deny";
}

// POST /api/living-groups/approve-join
// Approve or deny a join request for FSILG
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can approve join requests" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: ApproveJoinRequest = await request.json();
    const { membershipId, action } = body;

    if (!membershipId || !["approve", "deny"].includes(action)) {
      return NextResponse.json(
        { error: "Membership ID and valid action (approve/deny) are required" },
        { status: 400 }
      );
    }

    // Get the leader's living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Only FSILGs can approve/deny (dorms auto-approve)
    if (livingGroup.living_group_type !== "fsilg") {
      return NextResponse.json(
        { error: "Only FSILGs require approval for new members" },
        { status: 400 }
      );
    }

    // Get the membership request
    const { data: membership, error: membershipError } = await supabase
      .from("living_group_memberships")
      .select("id, living_group_id, status, user_id")
      .eq("id", membershipId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Verify the request belongs to this living group
    if (membership.living_group_id !== livingGroup.id) {
      return NextResponse.json(
        { error: "This request does not belong to your living group" },
        { status: 403 }
      );
    }

    // Verify the request is pending
    if (membership.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update the membership status
    const newStatus = action === "approve" ? "active" : "removed";
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (action === "approve") {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("living_group_memberships")
      .update(updateData)
      .eq("id", membershipId);

    if (updateError) {
      console.error("Approve join request error:", updateError);
      return NextResponse.json(
        { error: "Failed to process join request" },
        { status: 500 }
      );
    }

    const message = action === "approve"
      ? "Member approved successfully"
      : "Join request denied";

    return NextResponse.json({
      success: true,
      message,
      action,
    });
  } catch (error) {
    console.error("Approve join request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
