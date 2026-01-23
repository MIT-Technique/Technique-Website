import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List all clubs with member counts and leader emails
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,club_id.ilike.%${search}%`);
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    // Enrich clubs with member counts and leader emails
    const enrichedClubs = await Promise.all(
      (clubs || []).map(async (club) => {
        // Get active member count
        const { count: activeMemberCount } = await supabase
          .from('club_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);

        // Get manual member count
        const { count: manualMemberCount } = await supabase
          .from('club_manual_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);

        // Get up to 2 leaders with their user info
        const { data: leaderMemberships } = await supabase
          .from('club_memberships')
          .select('user_id')
          .eq('club_id', club.id)
          .eq('role', 'leader')
          .limit(2);

        let leaders: Array<{ email: string; first_name: string | null; last_name: string | null }> = [];

        if (leaderMemberships && leaderMemberships.length > 0) {
          const leaderUserIds = leaderMemberships.map(m => m.user_id);
          const { data: leaderUsers } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .in('id', leaderUserIds);

          leaders = leaderUsers || [];
        }

        return {
          ...club,
          active_member_count: activeMemberCount || 0,
          manual_member_count: manualMemberCount || 0,
          leaders,
        };
      })
    );

    return NextResponse.json({ clubs: enrichedClubs });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}
