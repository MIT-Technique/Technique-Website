import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

// GET /api/living-groups/my-memberships
// Get the current user's living group memberships
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all memberships for this user (active and pending)
    const { data: memberships, error } = await supabase
      .from("living_group_memberships")
      .select(`
        id,
        living_group_id,
        section_id,
        membership_type,
        status,
        joined_at,
        approved_at,
        living_group:living_groups!living_group_memberships_living_group_fkey(
          id,
          name,
          living_group_type,
          status
        ),
        section:dorm_sections!living_group_memberships_section_fkey(
          id,
          dorm_name,
          section_name
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Get memberships error:", error);
      return NextResponse.json(
        { error: "Failed to get memberships" },
        { status: 500 }
      );
    }

    // Separate into dorm and FSILG memberships
    const dormMembership = memberships?.find(m => m.membership_type === "dorm") || null;
    const fsilgMembership = memberships?.find(m => m.membership_type === "fsilg") || null;

    return NextResponse.json({
      memberships: memberships || [],
      dormMembership,
      fsilgMembership,
    });
  } catch (error) {
    console.error("Get memberships error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
