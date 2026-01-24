import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";

// GET /api/living-groups/members
// Get members of the leader's living group, grouped by section
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only living group leaders can view members
    if (user.role !== "living_group_leader") {
      return NextResponse.json(
        { error: "Only living group leaders can view members" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the leader's living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from("living_group_memberships")
      .select(`
        id,
        section_id,
        membership_type,
        status,
        joined_at,
        user:users!living_group_memberships_user_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        section:dorm_sections!living_group_memberships_section_fkey(
          id,
          section_name,
          display_order
        )
      `)
      .eq("living_group_id", livingGroup.id)
      .eq("status", "active")
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Get members error:", membersError);
      return NextResponse.json(
        { error: "Failed to get members" },
        { status: 500 }
      );
    }

    // Get expected counts for this living group
    const { data: expectedCounts, error: countsError } = await supabase
      .from("section_expected_counts")
      .select("section_id, expected_count")
      .eq("living_group_id", livingGroup.id);

    if (countsError) {
      console.error("Get expected counts error:", countsError);
    }

    // Build a map of expected counts by section_id
    const expectedCountMap: Record<string, number> = {};
    expectedCounts?.forEach((ec) => {
      const key = ec.section_id || "total";
      expectedCountMap[key] = ec.expected_count;
    });

    // Group members by section (for dorms) or return flat list (for FSILGs)
    if (livingGroup.living_group_type === "dorm") {
      // Get all sections for this dorm
      const { data: sections } = await supabase
        .from("dorm_sections")
        .select("id, section_name, display_order")
        .eq("dorm_name", livingGroup.name)
        .order("display_order", { ascending: true });

      // Group members by section
      const membersBySection = sections?.map((section) => {
        const sectionMembers = members?.filter(
          (m) => m.section_id === section.id
        ) || [];
        return {
          section,
          members: sectionMembers,
          memberCount: sectionMembers.length,
          expectedCount: expectedCountMap[section.id] || 0,
        };
      }) || [];

      // Add any members with no section (shouldn't happen for dorms, but just in case)
      const noSectionMembers = members?.filter((m) => !m.section_id) || [];

      return NextResponse.json({
        livingGroup,
        membersBySection,
        noSectionMembers,
        totalMembers: members?.length || 0,
        totalExpected: Object.values(expectedCountMap).reduce((a, b) => a + b, 0),
      });
    } else {
      // FSILG - flat list, no sections
      return NextResponse.json({
        livingGroup,
        members: members || [],
        totalMembers: members?.length || 0,
        expectedCount: expectedCountMap["total"] || 0,
      });
    }
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
