import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('living_groups')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: lgs, error } = await supabase
      .from('living_groups')
      .select('id, name, living_group_type, dorm_sections, section_images')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching living groups:", error);
      return NextResponse.json({ error: "Failed to fetch living groups" }, { status: 500 });
    }

    const lgIds = (lgs || []).map(lg => lg.id);

    // Get members per LG
    const { data: members } = await supabase
      .from('living_group_manual_members')
      .select('living_group_id, section_name')
      .in('living_group_id', lgIds);

    const memberCountMap: Record<string, Record<string, number>> = {};
    (members || []).forEach(m => {
      if (!memberCountMap[m.living_group_id]) memberCountMap[m.living_group_id] = {};
      const section = m.section_name || 'Unassigned';
      memberCountMap[m.living_group_id][section] = (memberCountMap[m.living_group_id][section] || 0) + 1;
    });

    // Get booking status
    const { data: bookings } = await supabase
      .from('photoshoot_times')
      .select('living_group_id')
      .not('living_group_id', 'is', null);

    const bookedLGs = new Set((bookings || []).map(b => b.living_group_id));

    const enrichedLGs = (lgs || []).map(lg => {
      const sections = (lg.dorm_sections || []).map((sectionName: string) => {
        const sectionImages = lg.section_images || {};
        return {
          name: sectionName,
          hasImage: !!sectionImages[sectionName],
          memberCount: memberCountMap[lg.id]?.[sectionName] || 0,
        };
      });

      const totalMembers = Object.values(memberCountMap[lg.id] || {}).reduce((a: number, b: number) => a + b, 0);

      return {
        id: lg.id,
        name: lg.name,
        type: lg.living_group_type,
        hasBooking: bookedLGs.has(lg.id),
        sections,
        totalMembers,
      };
    });

    const totalMembers = enrichedLGs.reduce((sum, lg) => sum + lg.totalMembers, 0);
    const withBookings = enrichedLGs.filter(lg => lg.hasBooking).length;

    let bucketImageCount = 0;
    try {
      for (const prefix of ['dorms', 'fsilgs']) {
        const { data: files } = await supabase.storage.from('living-group-images').list(prefix, { limit: 10000 });
        bucketImageCount += (files || []).filter(f => f.name && !f.name.endsWith('/')).length;
      }
    } catch (e) {
      console.error("Error listing LG images:", e);
    }

    return NextResponse.json({
      livingGroups: enrichedLGs,
      stats: {
        total: enrichedLGs.length,
        withBookings,
        totalMembers,
      },
      bucketImageCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
