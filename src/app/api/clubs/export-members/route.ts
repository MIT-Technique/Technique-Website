import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Export all member names for InDesign (combined active + manual, sorted by last name)
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
        { error: "Only club accounts can export members" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get club for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Get active members with user names
    const { data: activeMembers, error: membersError } = await supabase
      .from('club_memberships')
      .select(`
        user:users (
          first_name,
          last_name
        )
      `)
      .eq('club_id', club.id);

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
      .select('name')
      .eq('club_id', club.id);

    if (manualError) {
      console.error("Get manual members error:", manualError);
      return NextResponse.json(
        { error: "Failed to get manual members" },
        { status: 500 }
      );
    }

    // Combine and format names
    const allNames: string[] = [];

    // Add active member names
    if (activeMembers) {
      for (const member of activeMembers) {
        const userData = member.user as { first_name: string | null; last_name: string | null } | null;
        if (userData) {
          const firstName = userData.first_name || '';
          const lastName = userData.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) {
            allNames.push(fullName);
          }
        }
      }
    }

    // Add manual member names
    if (manualMembers) {
      for (const member of manualMembers) {
        if (member.name) {
          allNames.push(member.name);
        }
      }
    }

    // Sort by last name (assuming format "First Last")
    allNames.sort((a, b) => {
      const aLastName = a.split(' ').slice(-1)[0].toLowerCase();
      const bLastName = b.split(' ').slice(-1)[0].toLowerCase();
      return aLastName.localeCompare(bLastName);
    });

    return NextResponse.json({
      clubName: club.name,
      memberCount: allNames.length,
      members: allNames.join(', '),
      membersArray: allNames,
    });
  } catch (error) {
    console.error("Export members error:", error);
    return NextResponse.json(
      { error: "Failed to export members" },
      { status: 500 }
    );
  }
}
