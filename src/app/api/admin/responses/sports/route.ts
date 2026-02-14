import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('sports')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'filled', 'not_filled'

    const supabase = createAdminClient();

    const { data: sports, error } = await supabase
      .from('sports')
      .select('id, user_id, name, description, has_gender_teams, achievement_summary, candid_image_1, candid_image_2, candid_image_3, mens_achievement_summary, mens_candid_image_1, mens_candid_image_2, mens_candid_image_3, womens_achievement_summary, womens_candid_image_1, womens_candid_image_2, womens_candid_image_3')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching sports:", error);
      return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 });
    }

    const sportIds = (sports || []).map(s => s.id);

    // Fetch user emails in batch
    const userIds = (sports || []).map(s => s.user_id).filter(Boolean);
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, email').in('id', userIds)
      : { data: [] };

    const emailMap: Record<string, string> = {};
    (users || []).forEach(u => {
      emailMap[u.id] = u.email;
    });

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
      const email = emailMap[sport.user_id] || null;

      if (sport.has_gender_teams) {
        const mensImageUrls = [sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3].filter(Boolean);
        const womensImageUrls = [sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3].filter(Boolean);
        return {
          id: sport.id,
          name: sport.name,
          email,
          hasGenderTeams: true,
          hasDescription: !!sport.description?.trim(),
          mensHasAchievement: !!sport.mens_achievement_summary?.trim(),
          womensHasAchievement: !!sport.womens_achievement_summary?.trim(),
          mensImageCount: mensImageUrls.length,
          womensImageCount: womensImageUrls.length,
          mensImageUrls,
          womensImageUrls,
          mensMembers: m.mens,
          womensMembers: m.womens,
          coachCount: coachCountMap[sport.id] || 0,
        };
      } else {
        const imageUrls = [sport.candid_image_1, sport.candid_image_2, sport.candid_image_3].filter(Boolean);
        return {
          id: sport.id,
          name: sport.name,
          email,
          hasGenderTeams: false,
          hasDescription: !!sport.description?.trim(),
          hasAchievement: !!sport.achievement_summary?.trim(),
          imageCount: imageUrls.length,
          imageUrls,
          memberCount: m.total,
          coachCount: coachCountMap[sport.id] || 0,
        };
      }
    });

    // Apply filter
    let filteredSports = enrichedSports;
    if (filter === 'filled') {
      filteredSports = enrichedSports.filter(s => {
        if (s.hasGenderTeams) {
          return s.hasDescription || s.mensHasAchievement || s.womensHasAchievement ||
                 s.mensImageCount > 0 || s.womensImageCount > 0 ||
                 s.mensMembers > 0 || s.womensMembers > 0 || s.coachCount > 0;
        } else {
          return s.hasDescription || s.hasAchievement || s.imageCount > 0 || s.memberCount > 0 || s.coachCount > 0;
        }
      });
    } else if (filter === 'not_filled') {
      filteredSports = enrichedSports.filter(s => {
        if (s.hasGenderTeams) {
          return !s.hasDescription && !s.mensHasAchievement && !s.womensHasAchievement &&
                 s.mensImageCount === 0 && s.womensImageCount === 0 &&
                 s.mensMembers === 0 && s.womensMembers === 0 && s.coachCount === 0;
        } else {
          return !s.hasDescription && !s.hasAchievement && s.imageCount === 0 && s.memberCount === 0 && s.coachCount === 0;
        }
      });
    }

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
      (sports || []).forEach(sport => {
        if (sport.has_gender_teams) {
          bucketImageCount += [sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
            sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3].filter(Boolean).length;
        } else {
          bucketImageCount += [sport.candid_image_1, sport.candid_image_2, sport.candid_image_3].filter(Boolean).length;
        }
      });
    } catch (e) {
      console.error("Error counting sports images:", e);
    }

    return NextResponse.json({
      sports: filteredSports,
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
