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

  // For students, check if they're a leader of any club
  if (user.role === "student") {
    const { data: membership } = await supabase
      .from("club_memberships")
      .select("club_id")
      .eq("user_id", user.id)
      .eq("role", "leader")
      .single();

    if (membership) {
      return { clubId: membership.club_id };
    }
  }

  return {
    clubId: null,
    error: "Only club accounts and club leaders can access this resource",
  };
}

// GET - Search MIT students for inviting or adding as leaders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
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

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Search MIT students only (email ends with @mit.edu)
    const { data: students, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("role", "student")
      .ilike("email", "%@mit.edu")
      .or(
        `email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      )
      .limit(10);

    if (error) {
      console.error("Error searching students:", error);
      return NextResponse.json(
        { error: "Failed to search students" },
        { status: 500 }
      );
    }

    // Filter out students who are already members or have pending invitations
    const { data: existingMembers } = await supabase
      .from("club_memberships")
      .select("user_id")
      .eq("club_id", clubId);

    const { data: pendingInvitations } = await supabase
      .from("club_invitations")
      .select("user_id")
      .eq("club_id", clubId)
      .eq("status", "pending");

    const { data: pendingRequests } = await supabase
      .from("club_join_requests")
      .select("user_id")
      .eq("club_id", clubId)
      .eq("status", "pending");

    const excludeUserIds = new Set([
      ...(existingMembers || []).map((m) => m.user_id),
      ...(pendingInvitations || []).map((i) => i.user_id),
      ...(pendingRequests || []).map((r) => r.user_id),
    ]);

    const filteredStudents = (students || []).filter(
      (s) => !excludeUserIds.has(s.id)
    );

    return NextResponse.json({ students: filteredStudents });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
