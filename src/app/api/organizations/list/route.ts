import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Fetch all clubs
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name")
      .order("name");

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    // Fetch all living groups
    const { data: livingGroups, error: lgError } = await supabaseAdmin
      .from("living_groups")
      .select("id, name, living_group_type")
      .order("name");

    if (lgError) {
      console.error("Error fetching living groups:", lgError);
      return NextResponse.json(
        { error: "Failed to fetch living groups" },
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
