import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Fetch approved clubs
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name")
      .eq("approval_status", "approved")
      .order("name");

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    // Fetch active living groups
    const { data: livingGroups, error: lgError } = await supabaseAdmin
      .from("living_groups")
      .select("id, name, living_group_type")
      .eq("status", "active")
      .order("name");

    if (lgError) {
      console.error("Error fetching living groups:", lgError);
      return NextResponse.json(
        { error: "Failed to fetch living groups" },
        { status: 500 }
      );
    }

    // Fetch sports teams
    const { data: sportsTeams, error: sportsError } = await supabaseAdmin
      .from("sports")
      .select("id, name")
      .order("name");

    if (sportsError) {
      console.error("Error fetching sports teams:", sportsError);
      return NextResponse.json(
        { error: "Failed to fetch sports teams" },
        { status: 500 }
      );
    }

    // Combine and format the organizations
    const organizations = [
      ...clubs.map((club) => ({
        id: club.id,
        name: club.name,
        type: "club" as const,
      })),
      ...livingGroups.map((lg) => ({
        id: lg.id,
        name: lg.name,
        type: "living_group" as const,
        livingGroupType: lg.living_group_type,
      })),
      ...(sportsTeams || []).map((sport) => ({
        id: sport.id,
        name: sport.name,
        type: "sports" as const,
      })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
