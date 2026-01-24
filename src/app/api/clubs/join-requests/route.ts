import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// Helper to get club ID for either club account or club leader
async function getClubIdForUser(
  user: { id: string; role: string },
  supabase: ReturnType<typeof createAdminClient>,
  clubIdParam?: string | null
): Promise<{ clubId: string | null; error?: string }> {
  // If clubId is provided (for leaders), verify they're a leader of that club
  if (clubIdParam) {
    const { data: membership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubIdParam)
      .eq("user_id", user.id)
      .eq("role", "leader")
      .single();

    if (membership) {
      return { clubId: clubIdParam };
    }

    // Also check if they're the club account owner
    if (user.role === "club") {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubIdParam)
        .eq("user_id", user.id)
        .single();

      if (club) {
        return { clubId: clubIdParam };
      }
    }

    return { clubId: null, error: "You are not a leader of this club" };
  }

  // For club accounts without clubId param, get their club
  if (user.role === "club") {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (club) {
      return { clubId: club.id };
    }
    return { clubId: null, error: "Club not found" };
  }

  return {
    clubId: null,
    error: "Only club accounts and club leaders can access this resource",
  };
}

// GET - Get pending join requests for the club
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const clubIdParam = searchParams.get("clubId");

    // Get club ID (either from param for leaders, or from user account)
    const { clubId, error: clubIdError } = await getClubIdForUser(
      user,
      supabase,
      clubIdParam
    );

    if (!clubId || clubIdError) {
      return NextResponse.json(
        { error: clubIdError || "Club not found" },
        { status: 403 }
      );
    }

    // Get pending join requests with user details
    const { data: requests, error } = await supabase
      .from("club_join_requests")
      .select(
        `
        id,
        status,
        created_at,
        user:users (
          id,
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("club_id", clubId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get join requests error:", error);
      return NextResponse.json(
        { error: "Failed to get join requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Failed to get join requests" },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a join request
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { request_id, action, clubId: clubIdParam } = body;

    if (!request_id || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID (either from param for leaders, or from user account)
    const { clubId, error: clubIdError } = await getClubIdForUser(
      user,
      supabase,
      clubIdParam
    );

    if (!clubId || clubIdError) {
      return NextResponse.json(
        { error: clubIdError || "Club not found" },
        { status: 403 }
      );
    }

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from("club_join_requests")
      .select("id, club_id, user_id, status")
      .eq("id", request_id)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (joinRequest.club_id !== clubId) {
      return NextResponse.json(
        { error: "Join request does not belong to your club" },
        { status: 403 }
      );
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Join request has already been processed" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "denied";

    // Update the join request status
    const { error: updateError } = await supabase
      .from("club_join_requests")
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Update join request error:", updateError);
      return NextResponse.json(
        { error: "Failed to update join request" },
        { status: 500 }
      );
    }

    // If approved, create membership
    if (action === "approve") {
      const { error: membershipError } = await supabase
        .from("club_memberships")
        .insert({
          club_id: clubId,
          user_id: joinRequest.user_id,
          role: "member",
        });

      if (membershipError) {
        console.error("Create membership error:", membershipError);
        // Rollback the join request update
        await supabase
          .from("club_join_requests")
          .update({
            status: "pending",
            resolved_at: null,
          })
          .eq("id", request_id);

        return NextResponse.json(
          { error: "Failed to add member to club" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Process join request error:", error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
}
