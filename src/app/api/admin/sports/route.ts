import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List all sports teams
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'admin' && user.role !== 'staph')) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = supabase
      .from('sports')
      .select(`
        *,
        user:users(id, email, first_name, last_name)
      `)
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: sports, error } = await query;

    if (error) {
      console.error("Error fetching sports:", error);
      return NextResponse.json(
        { error: "Failed to fetch sports" },
        { status: 500 }
      );
    }

    // Fetch member counts for each sport
    const enrichedSports = await Promise.all(
      (sports || []).map(async (sport) => {
        const { count } = await supabase
          .from('sports_manual_members')
          .select('*', { count: 'exact', head: true })
          .eq('sports_id', sport.id);
        return { ...sport, memberCount: count || 0 };
      })
    );

    return NextResponse.json({ sports: enrichedSports });
  } catch (error) {
    console.error("Error fetching sports:", error);
    return NextResponse.json(
      { error: "Failed to fetch sports" },
      { status: 500 }
    );
  }
}
