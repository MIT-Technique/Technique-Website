import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name, description, candid_image_1, candid_image_2, candid_image_3')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }

    const clubIds = (clubs || []).map(c => c.id);

    const { data: members } = await supabase
      .from('club_manual_members')
      .select('club_id')
      .in('club_id', clubIds);

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

    const totalMembers = Object.values(memberCountMap).reduce((a, b) => a + b, 0);
    const withDescriptions = enrichedClubs.filter(c => c.hasDescription).length;
    const withMembers = enrichedClubs.filter(c => c.memberCount > 0).length;

    // Get image count from bucket
    let bucketImageCount = 0;
    try {
      const { data: files } = await supabase.storage.from('club-images').list('clubs', { limit: 10000 });
      bucketImageCount = (files || []).filter(f => f.name && !f.name.endsWith('/')).length;
    } catch (e) {
      console.error("Error listing club images:", e);
    }

    return NextResponse.json({
      clubs: enrichedClubs,
      stats: {
        total: enrichedClubs.length,
        withDescriptions,
        withMembers,
        totalMembers,
      },
      bucketImageCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
