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

    const { data: sports, error } = await supabase
      .from('sports')
      .select('id, name, description, has_gender_teams, achievement_summary, candid_image_1, candid_image_2, candid_image_3, mens_achievement_summary, mens_candid_image_1, mens_candid_image_2, mens_candid_image_3, womens_achievement_summary, womens_candid_image_1, womens_candid_image_2, womens_candid_image_3')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching sports:", error);
      return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 });
    }

    const sportIds = (sports || []).map(s => s.id);

    const { data: members } = await supabase
      .from('sports_manual_members')
      .select('sports_id, team')
      .in('sports_id', sportIds);

    const { data: coaches } = await supabase
      .from('sports_coaches')
      .select('sports_id')
      .in('sports_id', sportIds);

    const memberMap: Record<string, { mens: number; womens: number; total: number }> = {};
    (members || []).forEach(m => {
      if (!memberMap[m.sports_id]) memberMap[m.sports_id] = { mens: 0, womens: 0, total: 0 };
      memberMap[m.sports_id].total++;
      if (m.team === 'mens') memberMap[m.sports_id].mens++;
      else if (m.team === 'womens') memberMap[m.sports_id].womens++;
    });

    const coachCountMap: Record<string, number> = {};
    (coaches || []).forEach(c => {
      coachCountMap[c.sports_id] = (coachCountMap[c.sports_id] || 0) + 1;
    });

    const enrichedSports = (sports || []).map(sport => {
      const m = memberMap[sport.id] || { mens: 0, womens: 0, total: 0 };
      if (sport.has_gender_teams) {
        return {
          id: sport.id,
          name: sport.name,
          hasGenderTeams: true,
          hasDescription: !!sport.description?.trim(),
          mensHasAchievement: !!sport.mens_achievement_summary?.trim(),
          womensHasAchievement: !!sport.womens_achievement_summary?.trim(),
          mensImageCount: [sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3].filter(Boolean).length,
          womensImageCount: [sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3].filter(Boolean).length,
          mensMembers: m.mens,
          womensMembers: m.womens,
          coachCount: coachCountMap[sport.id] || 0,
        };
      } else {
        return {
          id: sport.id,
          name: sport.name,
          hasGenderTeams: false,
          hasDescription: !!sport.description?.trim(),
          hasAchievement: !!sport.achievement_summary?.trim(),
          imageCount: [sport.candid_image_1, sport.candid_image_2, sport.candid_image_3].filter(Boolean).length,
          memberCount: m.total,
          coachCount: coachCountMap[sport.id] || 0,
        };
      }
    });

    const totalMembers = (members || []).length;
    const totalCoaches = (coaches || []).length;
    const withAchievements = enrichedSports.filter(s =>
      s.hasGenderTeams ? (s.mensHasAchievement || s.womensHasAchievement) : s.hasAchievement
    ).length;
    const withMembers = enrichedSports.filter(s =>
      s.hasGenderTeams ? (s.mensMembers > 0 || s.womensMembers > 0) : s.memberCount > 0
    ).length;

    let bucketImageCount = 0;
    try {
      const { data: sportFolders } = await supabase.storage.from('sports-images').list('sports', { limit: 10000 });
      for (const folder of (sportFolders || []).filter(f => f.id)) {
        const { data: files } = await supabase.storage.from('sports-images').list(`sports/${folder.name}`, { limit: 10000 });
        for (const file of (files || [])) {
          if (file.metadata) {
            bucketImageCount++;
          } else {
            // It's a subfolder (mens/womens)
            const { data: subFiles } = await supabase.storage.from('sports-images').list(`sports/${folder.name}/${file.name}`, { limit: 10000 });
            bucketImageCount += (subFiles || []).filter(f => f.name && !f.name.endsWith('/')).length;
          }
        }
      }
    } catch (e) {
      console.error("Error listing sports images:", e);
    }

    return NextResponse.json({
      sports: enrichedSports,
      stats: {
        total: enrichedSports.length,
        withAchievements,
        withMembers,
        totalMembers,
        totalCoaches,
      },
      bucketImageCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
