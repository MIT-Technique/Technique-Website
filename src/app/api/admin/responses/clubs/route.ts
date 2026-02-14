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
    const filter = searchParams.get('filter') || 'all'; // 'all', 'filled', 'not_filled'

    const supabase = createAdminClient();

    // Build query - fetch all when filtering, otherwise paginate
    let clubQuery = supabase
      .from('clubs')
      .select('id, user_id, name, description, candid_image_1, candid_image_2, candid_image_3', { count: 'exact' })
      .order('name', { ascending: true });

    if (search) {
      clubQuery = clubQuery.ilike('name', `%${search}%`);
    }

    // Only apply DB-level pagination when no filter is active
    if (filter === 'all') {
      clubQuery = clubQuery.range(page * limit, (page + 1) * limit - 1);
    }

    const { data: clubs, error, count } = await clubQuery;

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    const clubIds = (clubs || []).map(c => c.id);

    // Fetch member counts
    const { data: members } = clubIds.length > 0
      ? await supabase.from('club_manual_members').select('club_id').in('club_id', clubIds)
      : { data: [] };

    const memberCountMap: Record<string, number> = {};
    (members || []).forEach(m => {
      memberCountMap[m.club_id] = (memberCountMap[m.club_id] || 0) + 1;
    });

    // Fetch user emails in batch
    const userIds = (clubs || []).map(c => c.user_id).filter(Boolean);
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, email').in('id', userIds)
      : { data: [] };

    const emailMap: Record<string, string> = {};
    (users || []).forEach(u => {
      emailMap[u.id] = u.email;
    });

    // Enrich clubs with email and image URLs
    const enrichedClubs = (clubs || []).map(club => {
      const imageUrls = [club.candid_image_1, club.candid_image_2, club.candid_image_3].filter(Boolean);
      return {
        id: club.id,
        name: club.name,
        email: emailMap[club.user_id] || null,
        hasDescription: !!club.description && club.description.trim().length > 0,
        imageCount: imageUrls.length,
        imageUrls,
        memberCount: memberCountMap[club.id] || 0,
      };
    });

    // Apply filter
    let filteredClubs = enrichedClubs;
    if (filter === 'filled') {
      filteredClubs = enrichedClubs.filter(c => c.hasDescription || c.imageCount > 0 || c.memberCount > 0);
    } else if (filter === 'not_filled') {
      filteredClubs = enrichedClubs.filter(c => !c.hasDescription && c.imageCount === 0 && c.memberCount === 0);
    }

    // Apply JS-level pagination when filter is active
    let paginatedClubs = filteredClubs;
    let totalCount = filter === 'all' ? (count || 0) : filteredClubs.length;
    if (filter !== 'all') {
      paginatedClubs = filteredClubs.slice(page * limit, (page + 1) * limit);
    }

    // Stats + bucket count only on initial load (page 0, no search, no filter)
    let stats = null;
    let bucketImageCount = 0;
    if (page === 0 && !search && filter === 'all') {
      const { count: totalClubCount } = await supabase
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
        total: totalClubCount || 0,
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
      clubs: paginatedClubs,
      totalCount,
      page,
      ...(stats && { stats, bucketImageCount }),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
