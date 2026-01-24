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

// GET - Get club's active members and manual members
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

    // Get active members with user details
    const { data: activeMembers, error: membersError } = await supabase
      .from("club_memberships")
      .select(
        `
        id,
        role,
        joined_at,
        user:users (
          id,
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("club_id", clubId)
      .order("joined_at", { ascending: false });

    if (membersError) {
      console.error("Get active members error:", membersError);
      return NextResponse.json(
        { error: "Failed to get active members" },
        { status: 500 }
      );
    }

    // Get manual members
    const { data: manualMembers, error: manualError } = await supabase
      .from("club_manual_members")
      .select("id, name, added_at")
      .eq("club_id", clubId)
      .order("name");

    if (manualError) {
      console.error("Get manual members error:", manualError);
      return NextResponse.json(
        { error: "Failed to get manual members" },
        { status: 500 }
      );
    }

    // Count leaders
    const leaderCount =
      activeMembers?.filter((m) => m.role === "leader").length || 0;

    return NextResponse.json({
      activeMembers: activeMembers || [],
      manualMembers: manualMembers || [],
      leaderCount,
      maxLeaders: 2,
    });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get members" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an active member from the club
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const membershipId = searchParams.get("id");
    const clubIdParam = searchParams.get("clubId");

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

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

    // Verify membership belongs to this club
    const { data: membership, error: membershipError } = await supabase
      .from("club_memberships")
      .select("id, club_id")
      .eq("id", membershipId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (membership.club_id !== clubId) {
      return NextResponse.json(
        { error: "Membership does not belong to your club" },
        { status: 403 }
      );
    }

    // Delete the membership
    const { error } = await supabase
      .from("club_memberships")
      .delete()
      .eq("id", membershipId);

    if (error) {
      console.error("Delete membership error:", error);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
