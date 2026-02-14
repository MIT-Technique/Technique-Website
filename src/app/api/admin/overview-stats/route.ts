import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

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

    // Fetch all counts in parallel
    const [
      clubsResult,
      livingGroupsResult,
      sportsResult,
      photoshootTimesResult,
      cancellationResult,
    ] = await Promise.all([
      supabase.from('clubs').select('id, description, candid_image_1, candid_image_2, candid_image_3'),
      supabase.from('living_groups').select('id, candid_image_1, candid_image_2, candid_image_3, candid_image_4'),
      supabase.from('sports').select('id, description, has_gender_teams, candid_image_1, candid_image_2, candid_image_3, mens_candid_image_1, mens_candid_image_2, mens_candid_image_3, womens_candid_image_1, womens_candid_image_2, womens_candid_image_3'),
      supabase.from('photoshoot_times').select('id, living_group_id'),
      supabase.from('photoshoot_times').select('id').eq('cancellation_requested', true).is('cancellation_approved', null),
    ]);

    const clubs = clubsResult.data || [];
    const livingGroups = livingGroupsResult.data || [];
    const sports = sportsResult.data || [];
    const photoshootTimes = photoshootTimesResult.data || [];
    const cancellations = cancellationResult.data || [];

    // Count descriptions filled
    const clubDescriptions = clubs.filter(c => c.description && c.description.trim()).length;
    const sportsDescriptions = sports.filter(s => s.description && s.description.trim()).length;

    // Count total images across all orgs
    let totalImages = 0;

    // Club images
    for (const club of clubs) {
      if (club.candid_image_1) totalImages++;
      if (club.candid_image_2) totalImages++;
      if (club.candid_image_3) totalImages++;
    }

    // Sports images
    for (const sport of sports) {
      if (sport.has_gender_teams) {
        if (sport.mens_candid_image_1) totalImages++;
        if (sport.mens_candid_image_2) totalImages++;
        if (sport.mens_candid_image_3) totalImages++;
        if (sport.womens_candid_image_1) totalImages++;
        if (sport.womens_candid_image_2) totalImages++;
        if (sport.womens_candid_image_3) totalImages++;
      } else {
        if (sport.candid_image_1) totalImages++;
        if (sport.candid_image_2) totalImages++;
        if (sport.candid_image_3) totalImages++;
      }
    }

    // Living group images (stored in candid_image_1-4 fields on living_groups table)
    let lgCandidsSubmitted = 0;
    let lgImageCount = 0;
    for (const lg of livingGroups) {
      let hasAnyImage = false;
      if (lg.candid_image_1) { lgImageCount++; hasAnyImage = true; }
      if (lg.candid_image_2) { lgImageCount++; hasAnyImage = true; }
      if (lg.candid_image_3) { lgImageCount++; hasAnyImage = true; }
      if (lg.candid_image_4) { lgImageCount++; hasAnyImage = true; }
      if (hasAnyImage) lgCandidsSubmitted++;
    }
    totalImages += lgImageCount;

    return NextResponse.json({
      clubs: {
        total: clubs.length,
        descriptionsCompleted: clubDescriptions,
      },
      livingGroups: {
        total: livingGroups.length,
        candidsSubmitted: lgCandidsSubmitted,
      },
      sports: {
        total: sports.length,
        descriptionsCompleted: sportsDescriptions,
      },
      totalImages,
      photoshoots: {
        booked: photoshootTimes.filter(t => t.living_group_id).length,
        cancellationRequests: cancellations.length,
      },
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview stats" },
      { status: 500 }
    );
  }
}
