import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET /api/living-groups/members
// Get members of the leader's living group, grouped by section
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

    const searchParams = request.nextUrl.searchParams;
    const livingGroupId = searchParams.get("livingGroupId");

    let livingGroup;

    if (livingGroupId) {
      // Fetch specific living group (for LG leader permissions)
      const { data: lg, error: lgError } = await supabase
        .from("living_groups")
        .select("id, name, living_group_type, user_id, dorm_sections")
        .eq("id", livingGroupId)
        .single();

      if (lgError || !lg) {
        return NextResponse.json(
          { error: "Living group not found" },
          { status: 404 }
        );
      }

      // Check authorization: owner, LG leader permission, admin, or staph
      const isOwner = lg.user_id === user.id;
      let isLeader = false;
      if (!isOwner) {
        const { data: leaderPermission } = await supabase
          .from("living_group_leader_permissions")
          .select("id")
          .eq("living_group_id", livingGroupId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();
        isLeader = !!leaderPermission;
      }

      if (!isOwner && !isLeader && user.role !== "admin" && user.role !== "staph") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      livingGroup = lg;
    } else {
      // Legacy behavior: get the leader's living group by user_id
      if (user.role !== "living_group") {
        return NextResponse.json(
          { error: "Only living group accounts can view members" },
          { status: 403 }
        );
      }

      const { data: lg, error: lgError } = await supabase
        .from("living_groups")
        .select("id, name, living_group_type, dorm_sections")
        .eq("user_id", user.id)
        .single();

      if (lgError || !lg) {
        return NextResponse.json(
          { error: "Living group not found" },
          { status: 404 }
        );
      }

      livingGroup = lg;
    }

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from("living_group_memberships")
      .select(`
        id,
        section_name,
        membership_type,
        status,
        joined_at,
        user:users!living_group_memberships_user_fkey(
          id,
          email,
          first_name,
          last_name
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
      .select("section_name, expected_count")
      .eq("living_group_id", livingGroup.id);

    if (countsError) {
      console.error("Get expected counts error:", countsError);
    }

    // Build a map of expected counts by section_name
    const expectedCountMap: Record<string, number> = {};
    expectedCounts?.forEach((ec) => {
      const key = ec.section_name || "total";
      expectedCountMap[key] = ec.expected_count;
    });

    // Group members by section (for dorms) or return flat list (for FSILGs)
    if (livingGroup.living_group_type === "dorm") {
      // Get sections from the dorm_sections column
      const sections = livingGroup.dorm_sections || [];

      // Group members by section
      const membersBySection = sections.map((sectionName: string) => {
        const sectionMembers = members?.filter(
          (m) => m.section_name === sectionName
        ) || [];
        return {
          section: { name: sectionName },
          members: sectionMembers,
          memberCount: sectionMembers.length,
          expectedCount: expectedCountMap[sectionName] || 0,
        };
      });

      // Add any members with no section (shouldn't happen for dorms, but just in case)
      const noSectionMembers = members?.filter((m) => !m.section_name) || [];

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

// POST /api/living-groups/members
// Add a student as a member of the living group
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { livingGroupId, userId, sectionName } = body;

    if (!livingGroupId || !userId) {
      return NextResponse.json(
        { error: "Living group ID and user ID are required" },
        { status: 400 }
      );
    }

    // Get the living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type, user_id, dorm_sections")
      .eq("id", livingGroupId)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check authorization: owner, LG leader permission, admin, or staph
    const isOwner = livingGroup.user_id === user.id;
    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", livingGroupId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && user.role !== "admin" && user.role !== "staph") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify the user to be added is a student
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", userId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "student") {
      return NextResponse.json(
        { error: "Can only add students as members" },
        { status: 400 }
      );
    }

    // Check if student is already a member
    const { data: existingMembership } = await supabase
      .from("living_group_memberships")
      .select("id")
      .eq("living_group_id", livingGroupId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Student is already a member of this living group" },
        { status: 400 }
      );
    }

    // For dorms, validate section name if provided
    if (livingGroup.living_group_type === "dorm" && sectionName) {
      const validSections = livingGroup.dorm_sections || [];
      if (!validSections.includes(sectionName)) {
        return NextResponse.json(
          { error: "Invalid section name" },
          { status: 400 }
        );
      }
    }

    // Add the membership
    const { data: membership, error: membershipError } = await supabase
      .from("living_group_memberships")
      .insert({
        living_group_id: livingGroupId,
        user_id: userId,
        section_name: livingGroup.living_group_type === "dorm" ? sectionName : null,
        membership_type: livingGroup.living_group_type,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (membershipError) {
      console.error("Add member error:", membershipError);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/living-groups/members
// Remove a member from the living group
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membershipId");

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    // Get the membership
    const { data: membership, error: membershipError } = await supabase
      .from("living_group_memberships")
      .select("id, living_group_id, user_id")
      .eq("id", membershipId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Get the living group
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, user_id")
      .eq("id", membership.living_group_id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check authorization: owner, LG leader permission, admin, or staph
    const isOwner = livingGroup.user_id === user.id;
    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", livingGroup.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && user.role !== "admin" && user.role !== "staph") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Remove the membership (soft delete by setting status to removed)
    const { error: deleteError } = await supabase
      .from("living_group_memberships")
      .update({ status: "removed" })
      .eq("id", membershipId);

    if (deleteError) {
      console.error("Remove member error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
