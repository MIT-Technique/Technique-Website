import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Search MIT students for inviting or adding as leaders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only club accounts and club leaders can search students
    const supabase = createAdminClient();

    // Check if user is club account or a leader of a club
    let clubId: string | null = null;

    if (user.role === 'club') {
      // Get the club for this club account
      const { data: club } = await supabase
        .from('clubs')
        .select('id')
        .eq('user_id', user.id)
        .single();
      clubId = club?.id || null;
    } else if (user.role === 'student' || user.role === 'living_group_leader') {
      // Check if user is a leader of any club
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('role', 'leader')
        .single();
      clubId = membership?.club_id || null;
    }

    if (!clubId) {
      return NextResponse.json(
        { error: "Only club accounts and club leaders can search students" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Search MIT students only (email ends with @mit.edu)
    const { data: students, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('role', 'student')
      .ilike('email', '%@mit.edu')
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
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
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', clubId);

    const { data: pendingInvitations } = await supabase
      .from('club_invitations')
      .select('user_id')
      .eq('club_id', clubId)
      .eq('status', 'pending');

    const { data: pendingRequests } = await supabase
      .from('club_join_requests')
      .select('user_id')
      .eq('club_id', clubId)
      .eq('status', 'pending');

    const excludeUserIds = new Set([
      ...(existingMembers || []).map(m => m.user_id),
      ...(pendingInvitations || []).map(i => i.user_id),
      ...(pendingRequests || []).map(r => r.user_id),
    ]);

    const filteredStudents = (students || []).filter(
      s => !excludeUserIds.has(s.id)
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
