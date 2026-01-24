import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getCurrentUser } from "../../../../lib/auth/session";

/**
 * GET /api/clubs/leader-access?clubId=xxx
 *
 * Fetches club data for a user who is a leader of the club.
 * Used by the ClubDashboardInline component in the profile page.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clubId = searchParams.get("clubId");

    if (!clubId) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user is a leader of this club
    const { data: membership, error: membershipError } = await supabase
      .from("club_memberships")
      .select("id, role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("role", "leader")
      .single();

    if (membershipError || !membership) {
      // Also check if user is the club account owner
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (clubError || !club) {
        return NextResponse.json(
          { error: "Club not found" },
          { status: 404 }
        );
      }

      // Check if user owns this club (role=club)
      if (user.role === "club") {
        const { data: userClub } = await supabase
          .from("clubs")
          .select("id")
          .eq("user_id", user.id)
          .eq("id", clubId)
          .single();

        if (userClub) {
          // User is the club account owner
          // Also check if club has a leader
          const { count: leaderCount } = await supabase
            .from("club_memberships")
            .select("*", { count: "exact", head: true })
            .eq("club_id", clubId)
            .eq("role", "leader");

          return NextResponse.json({
            club: {
              ...club,
              has_leader: (leaderCount || 0) > 0,
            },
          });
        }
      }

      return NextResponse.json(
        { error: "You are not a leader of this club" },
        { status: 403 }
      );
    }

    // User is a leader - fetch club data
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", clubId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Get leader count for the has_leader flag
    const { count: leaderCount } = await supabase
      .from("club_memberships")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("role", "leader");

    return NextResponse.json({
      club: {
        ...club,
        has_leader: (leaderCount || 0) > 0,
      },
    });
  } catch (error) {
    console.error("Leader access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
