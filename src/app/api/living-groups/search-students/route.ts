import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Search students by email
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const livingGroupId = searchParams.get("livingGroupId");
    const excludeMembers = searchParams.get("excludeMembers") === "true";
    const excludeLeaders = searchParams.get("excludeLeaders") === "true";

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user has access if livingGroupId is provided
    if (livingGroupId) {
      const { data: livingGroup } = await supabase
        .from("living_groups")
        .select("id, user_id")
        .eq("id", livingGroupId)
        .single();

      if (!livingGroup) {
        return NextResponse.json(
          { error: "Living group not found" },
          { status: 404 }
        );
      }

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
    }

    // Search for students by email (partial match)
    let studentsQuery = supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq("role", "student")
      .ilike("email", `%${query}%`)
      .limit(10);

    const { data: students, error } = await studentsQuery;

    if (error) {
      console.error("Search students error:", error);
      return NextResponse.json(
        { error: "Failed to search students" },
        { status: 500 }
      );
    }

    let results = students || [];

    // Filter out existing members if requested
    if (livingGroupId && excludeMembers) {
      const { data: existingMembers } = await supabase
        .from("living_group_memberships")
        .select("user_id")
        .eq("living_group_id", livingGroupId)
        .eq("status", "active");

      const memberIds = new Set((existingMembers || []).map(m => m.user_id));
      results = results.filter(s => !memberIds.has(s.id));
    }

    // Filter out existing leaders if requested
    if (livingGroupId && excludeLeaders) {
      const { data: existingLeaders } = await supabase
        .from("living_group_leader_permissions")
        .select("user_id")
        .eq("living_group_id", livingGroupId)
        .in("status", ["active", "pending"]);

      const leaderIds = new Set((existingLeaders || []).map(l => l.user_id));
      results = results.filter(s => !leaderIds.has(s.id));
    }

    const formattedResults = results.map(s => ({
      id: s.id,
      email: s.email,
      firstName: s.first_name,
      lastName: s.last_name,
      displayName: s.first_name && s.last_name
        ? `${s.first_name} ${s.last_name}`
        : s.email,
    }));

    return NextResponse.json({
      students: formattedResults,
    });
  } catch (error) {
    console.error("Search students error:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
