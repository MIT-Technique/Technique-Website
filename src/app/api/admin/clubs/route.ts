import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List clubs with member counts and email
// Supports ?limit=N&offset=N for pagination
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Get total count first
    let countQuery = supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,club_id.ilike.%${search}%`);
    }

    const { count: total } = await countQuery;

    // Fetch clubs
    let query = supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,club_id.ilike.%${search}%`);
    }

    if (limit !== null) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    // Batch fetch member counts and user emails instead of N+1 queries
    const clubIds = (clubs || []).map(c => c.id);
    const userIds = (clubs || []).map(c => c.user_id);

    // Get all member counts in one query
    const { data: memberCounts } = await supabase
      .from('club_manual_members')
      .select('club_id')
      .in('club_id', clubIds);

    const countMap: Record<string, number> = {};
    (memberCounts || []).forEach(m => {
      countMap[m.club_id] = (countMap[m.club_id] || 0) + 1;
    });

    // Get all user emails in one query
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const emailMap: Record<string, string> = {};
    (users || []).forEach(u => {
      emailMap[u.id] = u.email;
    });

    const enrichedClubs = (clubs || []).map(club => ({
      ...club,
      manual_member_count: countMap[club.id] || 0,
      email: emailMap[club.user_id] || null,
    }));

    return NextResponse.json({ clubs: enrichedClubs, total: total || 0 });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}
