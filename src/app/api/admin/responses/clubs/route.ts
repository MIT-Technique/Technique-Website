import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('clubs')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const supabase = createAdminClient();

    let clubQuery = supabase
      .from('clubs')
      .select('id, name, description, candid_image_1, candid_image_2, candid_image_3', { count: 'exact' })
      .order('name', { ascending: true });

    if (search) {
      clubQuery = clubQuery.ilike('name', `%${search}%`);
    }

    const { data: clubs, error, count } = await clubQuery
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    const clubIds = (clubs || []).map(c => c.id);

    const { data: members } = clubIds.length > 0
      ? await supabase.from('club_manual_members').select('club_id').in('club_id', clubIds)
      : { data: [] };

    const memberCountMap: Record<string, number> = {};
    (members || []).forEach(m => {
      memberCountMap[m.club_id] = (memberCountMap[m.club_id] || 0) + 1;
    });

    const enrichedClubs = (clubs || []).map(club => ({
      id: club.id,
      name: club.name,
      hasDescription: !!club.description && club.description.trim().length > 0,
      imageCount: [club.candid_image_1, club.candid_image_2, club.candid_image_3].filter(Boolean).length,
      memberCount: memberCountMap[club.id] || 0,
    }));

    // Stats + bucket count only on initial load (page 0, no search)
    let stats = null;
    let bucketImageCount = 0;
    if (page === 0 && !search) {
      const { count: totalCount } = await supabase
        .from('clubs')
        .select('id', { count: 'exact', head: true });

      const { count: descCount } = await supabase
        .from('clubs')
        .select('id', { count: 'exact', head: true })
        .neq('description', '')
        .not('description', 'is', null);

      const { data: allMembers } = await supabase
        .from('club_manual_members')
        .select('club_id');
      const uniqueClubsWithMembers = new Set((allMembers || []).map(m => m.club_id));

      stats = {
        total: totalCount || 0,
        withDescriptions: descCount || 0,
        withMembers: uniqueClubsWithMembers.size,
        totalMembers: (allMembers || []).length,
      };

      try {
        const { data: files } = await supabase.storage.from('club-images').list('clubs', { limit: 10000 });
        bucketImageCount = (files || []).filter(f => f.name && !f.name.endsWith('/')).length;
      } catch (e) {
        console.error("Error listing club images:", e);
      }
    }

    return NextResponse.json({
      clubs: enrichedClubs,
      totalCount: count || 0,
      page,
      ...(stats && { stats, bucketImageCount }),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
