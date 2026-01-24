import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Demote a leader to regular member
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can demote leaders" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { membership_id } = body;

    if (!membership_id) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Verify membership belongs to this club and is a leader
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('id, club_id, role')
      .eq('id', membership_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (membership.club_id !== club.id) {
      return NextResponse.json(
        { error: "Membership does not belong to your club" },
        { status: 403 }
      );
    }

    if (membership.role !== 'leader') {
      return NextResponse.json(
        { error: "User is not a leader" },
        { status: 400 }
      );
    }

    // Demote to member
    const { error } = await supabase
      .from('club_memberships')
      .update({ role: 'member' })
      .eq('id', membership_id);

    if (error) {
      console.error("Demote leader error:", error);
      return NextResponse.json(
        { error: "Failed to demote leader" },
        { status: 500 }
      );
    }

    // Check if there are any remaining leaders and update has_leader accordingly
    const { count: leaderCount } = await supabase
      .from('club_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .eq('role', 'leader');

    if (leaderCount === 0) {
      await supabase
        .from('clubs')
        .update({ has_leader: false })
        .eq('id', club.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demote leader error:", error);
    return NextResponse.json(
      { error: "Failed to demote leader" },
      { status: 500 }
    );
  }
}
