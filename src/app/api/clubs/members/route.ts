import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get club's active members and manual members
export async function GET() {
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
        { error: "Only club accounts can access members" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
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

    // Get active members with user details
    const { data: activeMembers, error: membersError } = await supabase
      .from('club_memberships')
      .select(`
        id,
        role,
        joined_at,
        user:users (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('club_id', club.id)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error("Get active members error:", membersError);
      return NextResponse.json(
        { error: "Failed to get active members" },
        { status: 500 }
      );
    }

    // Get manual members
    const { data: manualMembers, error: manualError } = await supabase
      .from('club_manual_members')
      .select('id, name, added_at')
      .eq('club_id', club.id)
      .order('name');

    if (manualError) {
      console.error("Get manual members error:", manualError);
      return NextResponse.json(
        { error: "Failed to get manual members" },
        { status: 500 }
      );
    }

    // Count leaders
    const leaderCount = activeMembers?.filter(m => m.role === 'leader').length || 0;

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can remove members" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const membershipId = searchParams.get("id");

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
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

    // Verify membership belongs to this club
    const { data: membership, error: membershipError } = await supabase
      .from('club_memberships')
      .select('id, club_id')
      .eq('id', membershipId)
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

    // Delete the membership
    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('id', membershipId);

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
