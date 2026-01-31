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
      .select('id, name, living_group_type, dorm_sections, section_images, manually_booked, manually_booked_by')
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

    // Get time assignments per section
    const { data: timeAssignments } = await supabase
      .from('living_group_time_assignments')
      .select('living_group_id, section_name')
      .in('living_group_id', lgIds);

    const assignedSections: Record<string, Set<string>> = {};
    (timeAssignments || []).forEach(ta => {
      if (!assignedSections[ta.living_group_id]) assignedSections[ta.living_group_id] = new Set();
      if (ta.section_name) assignedSections[ta.living_group_id].add(ta.section_name);
    });

    // Resolve manually_booked_by user names
    const bookerIds = [...new Set((lgs || []).map(lg => lg.manually_booked_by).filter(Boolean))];
    const bookerNameMap: Record<string, string> = {};
    if (bookerIds.length > 0) {
      const { data: bookers } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', bookerIds);
      (bookers || []).forEach(u => {
        bookerNameMap[u.id] = u.name || u.email;
      });
    }

    const enrichedLGs = (lgs || []).map(lg => {
      const sectionImages = lg.section_images || {};
      const sections = (lg.dorm_sections || []).map((sectionName: string) => {
        return {
          name: sectionName,
          hasImage: !!sectionImages[sectionName],
          memberCount: memberCountMap[lg.id]?.[sectionName] || 0,
          hasTimeAssignment: assignedSections[lg.id]?.has(sectionName) || false,
        };
      });

      const candidCount = Object.values(sectionImages).filter(Boolean).length;
      const totalMembers = Object.values(memberCountMap[lg.id] || {}).reduce((a: number, b: number) => a + b, 0);

      return {
        id: lg.id,
        name: lg.name,
        type: lg.living_group_type,
        hasBooking: bookedLGs.has(lg.id),
        manuallyBooked: lg.manually_booked || false,
        manuallyBookedByName: lg.manually_booked_by ? (bookerNameMap[lg.manually_booked_by] || null) : null,
        candidCount,
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
