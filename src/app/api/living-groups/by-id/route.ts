import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get living group data by ID
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Living group ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group
    const { data: livingGroup, error } = await supabase
      .from("living_groups")
      .select(`
        id,
        name,
        status,
        living_group_type,
        user_id,
        has_leader,
        dorm_sections,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single();

    if (error || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Check if user has access (owner, leader, admin, or staph)
    const isOwner = livingGroup.user_id === user.id;

    let isLeader = false;
    if (!isOwner) {
      const { data: leaderPermission } = await supabase
        .from("living_group_leader_permissions")
        .select("id")
        .eq("living_group_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      isLeader = !!leaderPermission;
    }

    if (!isOwner && !isLeader && user.role !== "admin" && !user.is_staph) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ livingGroup });
  } catch (error) {
    console.error("Get living group by ID error:", error);
    return NextResponse.json(
      { error: "Failed to get living group data" },
      { status: 500 }
    );
  }
}
